import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

const Analytics = () => {
    const [habits, setHabits] = useState([]);
    const [history, setHistory] = useState([]);
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
        } catch (error) {
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const totalDays = history.length;
    const completedDays = history.filter(d => d.completed).length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

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
    const streak = calculateStreak();

    const getProductiveDay = () => {
        if (history.length === 0) return 'N/A';
        const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        history.forEach(d => {
            if (d.completed) {
                const date = new Date(d.date);
                dayCount[date.getDay()]++;
            }
        });
        const max = Math.max(...Object.values(dayCount));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return max > 0 ? days[Object.keys(dayCount).find(key => dayCount[key] === max)] : 'N/A';
    };

    const last7Days = history.slice(-7);
    const weeklyCompletion = last7Days.filter(d => d.completed).length;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};
    history.forEach(d => {
        const date = new Date(d.date);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { total: 0, completed: 0 };
        monthlyData[monthKey].total++;
        if (d.completed) monthlyData[monthKey].completed++;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Habit Insights</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{completionRate}%</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Current Streak</p>
                    <p className="text-2xl font-bold text-orange-500">{streak} days</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Habits</p>
                    <p className="text-2xl font-bold text-gray-900">{habits.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Days Tracked</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Progress */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">📅 This Week</h3>
                    <div className="flex justify-between">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                            const dayData = last7Days[i];
                            return (
                                <div key={i} className="flex flex-col items-center">
                                    <span className="text-xs text-gray-400 mb-1">{day}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                                        dayData?.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {dayData?.completed ? '✅' : '⬜'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        {weeklyCompletion} of 7 days completed this week
                    </p>
                </div>

                {/* Monthly Summary */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">📊 Monthly Progress</h3>
                    <div className="space-y-2">
                        {Object.keys(monthlyData).slice(-6).map(month => {
                            const data = monthlyData[month];
                            const rate = Math.round((data.completed / data.total) * 100);
                            return (
                                <div key={month} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-20">{month}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all"
                                            style={{ width: `${rate}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 w-12">{rate}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Habit Breakdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Habit Completion</h3>
                {habits.length === 0 ? (
                    <p className="text-gray-400 text-sm">No habits to analyze yet.</p>
                ) : (
                    <div className="space-y-2">
                        {habits.map(h => (
                            <div key={h._id} className="flex items-center gap-3">
                                <span className="text-sm w-32 truncate">{h.name}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${h.todayCompleted ? 100 : 0}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-10">
                                    {h.todayCompleted ? '✅' : '⬜'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                    <h3 className="font-semibold text-gray-900 mb-1">💡 Best Day</h3>
                    <p className="text-sm text-gray-700">
                        You're most productive on <span className="font-medium">{getProductiveDay()}</span>!
                    </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <h3 className="font-semibold text-gray-900 mb-1">🎯 Top Habit</h3>
                    <p className="text-sm text-gray-700">
                        {habits.length > 0 ? (
                            <>
                                Your most consistent habit is <span className="font-medium">{habits[0]?.name}</span>
                            </>
                        ) : (
                            'Add habits to see insights!'
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;