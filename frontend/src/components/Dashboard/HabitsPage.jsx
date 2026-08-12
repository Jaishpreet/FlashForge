import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';
import { 
    StreakCounter, 
    DailyProgress, 
    MotivationalQuote, 
    WeeklySummary 
} from './HabitStats';

const HabitsPage = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDesc, setNewHabitDesc] = useState('');
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        fetchHabits();
        fetchHistory();
    }, []);

    const fetchHabits = async () => {
        try {
            const response = await axios.get(`${API_URL}/habits`);
            setHabits(response.data);
        } catch (error) {
            toast.error('Failed to load habits');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            // Get history for first habit (or aggregate later)
            if (habits.length > 0) {
                const response = await axios.get(`${API_URL}/habits/${habits[0]._id}/history`);
                setHistory(response.data.history || []);
            }
        } catch (error) {
            // Silently fail
        }
    };

    // Calculate streak (simplified)
    const calculateStreak = () => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].completed) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    const createHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) {
            toast.error('Please enter a habit name');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/habits`, {
                name: newHabitName.trim(),
                description: newHabitDesc.trim()
            });
            setHabits([response.data, ...habits]);
            setNewHabitName('');
            setNewHabitDesc('');
            toast.success('Habit created! 💪');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create habit');
        }
    };

    const toggleHabit = async (habitId, currentStatus) => {
        setToggling(habitId);
        try {
            await axios.post(`${API_URL}/habits/${habitId}/log`, {
                completed: !currentStatus
            });
            setHabits(habits.map(h => 
                h._id === habitId 
                    ? { ...h, todayCompleted: !currentStatus }
                    : h
            ));
            toast.success(currentStatus ? 'Unmarked!' : 'Done! ✅');
        } catch (error) {
            toast.error('Failed to update habit');
        } finally {
            setToggling(null);
        }
    };

    const deleteHabit = async (habitId) => {
        if (!window.confirm('Delete this habit?')) return;
        
        try {
            await axios.delete(`${API_URL}/habits/${habitId}`);
            setHabits(habits.filter(h => h._id !== habitId));
            toast.success('Habit deleted');
        } catch (error) {
            toast.error('Failed to delete habit');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading your habits...</div>
            </div>
        );
    }

    const streak = calculateStreak();
    const completedToday = habits.filter(h => h.todayCompleted).length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">✅</span>
                <h1 className="text-3xl font-bold text-gray-900">HabitForge</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <StreakCounter streak={streak} />
                <DailyProgress habits={habits} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                    <MotivationalQuote 
                        completedCount={completedToday} 
                        totalHabits={habits.length} 
                    />
                </div>
                <div>
                    <WeeklySummary history={history} />
                </div>
            </div>

            {/* Add Habit Form */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Add New Habit</h2>
                <form onSubmit={createHabit} className="space-y-3">
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="e.g., Drink 3L water"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                        type="text"
                        value={newHabitDesc}
                        onChange={(e) => setNewHabitDesc(e.target.value)}
                        placeholder="Optional description"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Add Habit
                    </button>
                </form>
            </div>

            {/* Habit List */}
            {habits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <span className="text-6xl block mb-4">🌟</span>
                    <p className="text-gray-600">No habits yet. Add your first one above!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <div
                            key={habit._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{habit.name}</h3>
                                    {habit.description && (
                                        <p className="text-sm text-gray-500">{habit.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleHabit(habit._id, habit.todayCompleted)}
                                        disabled={toggling === habit._id}
                                        className={`px-4 py-2 rounded-lg transition-all ${
                                            habit.todayCompleted
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {habit.todayCompleted ? '✅ Done' : '⬜ Mark Done'}
                                    </button>
                                    <button
                                        onClick={() => deleteHabit(habit._id)}
                                        className="text-red-400 hover:text-red-600 transition-colors p-2"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HabitsPage;