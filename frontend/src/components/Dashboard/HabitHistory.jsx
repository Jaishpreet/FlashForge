import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

const HabitHistory = ({ habitId, habits, onSelect }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (habitId) {
            fetchHistory(habitId);
        } else {
            setHistory(null);
        }
    }, [habitId]);

    const fetchHistory = async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/habits/${id}/history`);
            setHistory(response.data);
        } catch (error) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const selectedHabit = habits.find(h => h._id === habitId);

    if (!habitId) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">📊 Habit History</h2>
                <p className="text-gray-500 text-sm text-center py-8">
                    Click on a habit to see its history
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">📊 Habit History</h2>
                <div className="text-gray-500 text-center py-8">Loading...</div>
            </div>
        );
    }

    if (!history) {
        return null;
    }

    const { habit, history: dates, totalDays, completedDays, streak } = history;

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold">{habit.name}</h2>
                    <p className="text-sm text-gray-500">
                        {completedDays} / {totalDays} days
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{streak}</div>
                    <div className="text-xs text-gray-500">day streak</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {dates.map((day, index) => (
                    <div
                        key={index}
                        className={`aspect-square rounded-md text-xs flex items-center justify-center transition-colors ${
                            day.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                        }`}
                        title={`${day.date}: ${day.completed ? '✅' : '❌'}`}
                    >
                        {day.day}
                    </div>
                ))}
            </div>

            {/* Month Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                {dates.length > 0 && (
                    <>
                        <span>{dates[0]?.month}</span>
                        <span>{dates[dates.length - 1]?.month}</span>
                    </>
                )}
            </div>

            <div className="mt-4 flex justify-between text-xs text-gray-500 border-t pt-3">
                <span>Total: {totalDays} days</span>
                <span>Done: {completedDays} days</span>
                <span className="text-green-600">🔥 {streak} streak</span>
            </div>

            <button
                onClick={() => onSelect(null)}
                className="mt-3 w-full text-sm text-indigo-600 hover:text-indigo-800"
            >
                Close History
            </button>
        </div>
    );
};

export default HabitHistory;