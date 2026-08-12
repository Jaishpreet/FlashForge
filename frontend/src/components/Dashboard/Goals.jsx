import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

const Goals = () => {
    const [habits, setHabits] = useState([]);
    const [history, setHistory] = useState([]);
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [selectedHabit, setSelectedHabit] = useState('');
    const [targetDays, setTargetDays] = useState(7);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const habitsRes = await axios.get(`${API_URL}/habits`);
            setHabits(habitsRes.data);
            
            if (habitsRes.data.length > 0) {
                const histRes = await axios.get(`${API_URL}/habits/${habitsRes.data[0]._id}/history`);
                setHistory(histRes.data.history || []);
            }

            // Load goals from localStorage
            const stored = localStorage.getItem('habitGoals');
            if (stored) {
                setGoals(JSON.parse(stored));
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const saveGoals = (updatedGoals) => {
        localStorage.setItem('habitGoals', JSON.stringify(updatedGoals));
        setGoals(updatedGoals);
    };

    const addGoal = () => {
        if (!newGoal.trim() || !selectedHabit) {
            toast.error('Please select a habit and enter a goal');
            return;
        }

        const goal = {
            id: Date.now().toString(),
            habitId: selectedHabit,
            habitName: habits.find(h => h._id === selectedHabit)?.name || 'Unknown',
            description: newGoal.trim(),
            targetDays: targetDays,
            createdAt: new Date().toISOString(),
            achieved: false
        };

        const updated = [...goals, goal];
        saveGoals(updated);
        setNewGoal('');
        setSelectedHabit('');
        setTargetDays(7);
        toast.success('Goal added! 🎯');
    };

    const toggleAchieved = (goalId) => {
        const updated = goals.map(g => 
            g.id === goalId ? { ...g, achieved: !g.achieved } : g
        );
        saveGoals(updated);
        toast.success(updated.find(g => g.id === goalId)?.achieved ? '🎉 Goal achieved!' : 'Goal unmarked');
    };

    const deleteGoal = (goalId) => {
        if (!window.confirm('Delete this goal?')) return;
        const updated = goals.filter(g => g.id !== goalId);
        saveGoals(updated);
        toast.success('Goal deleted');
    };

    const getGoalProgress = (goal) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].completed) {
                streak++;
            } else {
                break;
            }
        }
        return Math.min(Math.round((streak / goal.targetDays) * 100), 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading goals...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">🎯 Goals</h1>

            {/* Add Goal Form */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Set a New Goal</h3>
                <div className="space-y-3">
                    <select
                        value={selectedHabit}
                        onChange={(e) => setSelectedHabit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select a habit...</option>
                        {habits.map(h => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="e.g., Complete 30-day streak"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">Target Days</label>
                            <input
                                type="number"
                                value={targetDays}
                                onChange={(e) => setTargetDays(parseInt(e.target.value) || 7)}
                                min={1}
                                max={365}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={addGoal}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors self-end"
                        >
                            Add Goal
                        </button>
                    </div>
                </div>
            </div>

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <span className="text-6xl block mb-4">🎯</span>
                    <p className="text-gray-500">No goals set yet</p>
                    <p className="text-gray-400 text-sm">Set your first goal above!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map(goal => {
                        const progress = getGoalProgress(goal);
                        const isComplete = goal.achieved || progress >= 100;
                        return (
                            <div key={goal.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${isComplete ? 'text-green-600 line-through' : 'text-gray-900'}`}>
                                                {goal.description}
                                            </span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                {goal.habitName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 max-w-xs">
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {Math.min(progress, 100)}% ({goal.targetDays} days)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAchieved(goal.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                isComplete
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {isComplete ? '✅ Achieved' : 'Mark Done'}
                                        </button>
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Goals;