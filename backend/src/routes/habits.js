import express from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// GET ALL HABITS
// ============================================================

router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId })
            .sort({ createdAt: -1 });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const habitsWithStatus = await Promise.all(habits.map(async (habit) => {
            const log = await HabitLog.findOne({
                habitId: habit._id,
                userId: req.userId,
                date: today
            });
            return {
                ...habit.toObject(),
                todayCompleted: log ? log.completed : false
            };
        }));
        
        res.json(habitsWithStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// CREATE A HABIT
// ============================================================

router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Habit name is required' });
        }

        const habit = new Habit({
            userId: req.userId,
            name: name.trim(),
            description: description?.trim() || ''
        });

        await habit.save();
        res.status(201).json({ ...habit.toObject(), todayCompleted: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DELETE A HABIT
// ============================================================

router.delete('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        await HabitLog.deleteMany({ habitId: req.params.id });
        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// TOGGLE COMPLETION (WITH CUSTOM DATE SUPPORT)
// ============================================================

router.post('/:id/log', auth, async (req, res) => {
    try {
        const { completed, date } = req.body;

        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        let logDate = date ? new Date(date) : new Date();
        logDate.setHours(0, 0, 0, 0);

        let log = await HabitLog.findOne({
            habitId: req.params.id,
            userId: req.userId,
            date: logDate
        });

        if (log) {
            log.completed = completed !== undefined ? completed : !log.completed;
            await log.save();
        } else {
            log = new HabitLog({
                habitId: req.params.id,
                userId: req.userId,
                date: logDate,
                completed: completed !== undefined ? completed : true
            });
            await log.save();
        }

        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET HABIT HISTORY (Calendar Grid)
// ============================================================

router.get('/:id/history', auth, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);

        const logs = await HabitLog.find({
            habitId: req.params.id,
            userId: req.userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const historyMap = {};
        logs.forEach(log => {
            const dateKey = log.date.toISOString().split('T')[0];
            historyMap[dateKey] = log.completed;
        });

        const allDates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            allDates.push({
                date: dateKey,
                completed: historyMap[dateKey] || false,
                day: currentDate.getDate(),
                month: currentDate.toLocaleString('default', { month: 'short' })
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({
            habit: habit,
            history: allDates,
            totalDays: allDates.length,
            completedDays: allDates.filter(d => d.completed).length,
            streak: calculateStreak(allDates)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// EXPORT ALL HABIT DATA (CSV)
// ============================================================

router.get('/export', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId });
        const logs = await HabitLog.find({ userId: req.userId }).sort({ date: 1 });

        const exportData = [];
        for (const log of logs) {
            const habit = habits.find(h => h._id.toString() === log.habitId.toString());
            if (habit) {
                exportData.push({
                    habitName: habit.name,
                    date: log.date.toISOString().split('T')[0],
                    completed: log.completed
                });
            }
        }

        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function calculateStreak(dates) {
    let streak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
        if (dates[i].completed) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export default router;