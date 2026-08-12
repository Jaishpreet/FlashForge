import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema({
    habitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }
    },
    completed: {
        type: Boolean,
        default: false
    }
});

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });

const HabitLog = mongoose.model('HabitLog', habitLogSchema);
export default HabitLog;