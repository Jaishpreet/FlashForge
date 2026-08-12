import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// STAT CARDS
// ============================================================

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                {subtext && <p className="text-xs text-gray-400 truncate">{subtext}</p>}
            </div>
        </div>
    </div>
);

// ============================================================
// MONTHLY CALENDAR COMPONENT - WITH 3-COLOR SYSTEM
// ============================================================

const MonthlyCalendar = ({ habits, history }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a map of completed dates for each habit
    const habitCompletions = {};
    if (history && habits.length > 0) {
        // Group history by date
        const dateMap = {};
        history.forEach(day => {
            if (!dateMap[day.date]) dateMap[day.date] = [];
            dateMap[day.date].push(day.completed);
        });
        
        // For each date, count how many habits were completed
        for (const date in dateMap) {
            const completions = dateMap[date];
            const totalHabits = habits.length;
            const completedCount = completions.filter(c => c).length;
            habitCompletions[date] = {
                completed: completedCount,
                total: totalHabits,
                allDone: completedCount === totalHabits,
                someDone: completedCount > 0 && completedCount < totalHabits,
                noneDone: completedCount === 0
            };
        }
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let allDoneDays = 0;
    let someDoneDays = 0;
    let noneDoneDays = 0;
    let totalDays = 0;
    const today = new Date();
    
    for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(year, month, i + 1);
        const dateStr = date.toISOString().split('T')[0];
        if (date > today) continue;
        totalDays++;
        
        const dayData = habitCompletions[dateStr];
        if (dayData) {
            if (dayData.allDone) allDoneDays++;
            else if (dayData.someDone) someDoneDays++;
            else noneDoneDays++;
        } else {
            noneDoneDays++;
        }
    }
    
    const completionRate = totalDays > 0 ? Math.round((allDoneDays / totalDays) * 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                    📅 {monthNames[month]} {year}
                </h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        →
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-1">
                {days.map(d => (
                    <div key={d} className="text-center text-[10px] font-medium text-gray-400">
                        {d}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const dateStr = date.toISOString().split('T')[0];
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isFuture = date > new Date();
                    
                    const dayData = habitCompletions[dateStr];
                    let bgColor = 'bg-gray-50';
                    let textColor = 'text-gray-400';
                    let tooltipText = 'No data';
                    
                    if (!isFuture && dayData) {
                        if (dayData.allDone) {
                            bgColor = 'bg-green-500';
                            textColor = 'text-white';
                            tooltipText = `✅ All ${habits.length} habits done!`;
                        } else if (dayData.someDone) {
                            bgColor = 'bg-yellow-400';
                            textColor = 'text-white';
                            tooltipText = `⚠️ ${dayData.completed}/${habits.length} habits done`;
                        } else {
                            bgColor = 'bg-gray-200';
                            textColor = 'text-gray-400';
                            tooltipText = '❌ No habits done';
                        }
                    } else if (isFuture) {
                        bgColor = 'bg-gray-50';
                        textColor = 'text-gray-200';
                        tooltipText = 'Future day';
                    }
                    
                    return (
                        <div
                            key={day}
                            className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${bgColor} ${textColor} ${isToday && !isFuture ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                            title={tooltipText}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <span className="text-xs text-gray-500">All done</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
                        <span className="text-xs text-gray-500">Partial</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
                        <span className="text-xs text-gray-500">None</span>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span><span className="font-medium text-gray-700">{allDoneDays}</span> full days</span>
                    <span><span className="font-medium text-yellow-600">{someDoneDays}</span> partial days</span>
                    <span><span className="font-medium text-gray-400">{noneDoneDays}</span> missed days</span>
                    <span className="font-medium text-indigo-600">{completionRate}% full</span>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MAIN HABITS PAGE
// ============================================================

const HabitsPage = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDesc, setNewHabitDesc] = useState('');
    const [toggling, setToggling] = useState(null);
    const [history, setHistory] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        fetchHabits();
    }, []);

    // ============================================================
    // FIXED: Get history for ALL habits
    // ============================================================

    const fetchHabits = async () => {
        try {
            const response = await axios.get(`${API_URL}/habits`);
            setHabits(response.data);
            
            // ✅ Get history for ALL habits
            if (response.data.length > 0) {
                const allHistory = [];
                for (const habit of response.data) {
                    try {
                        const histRes = await axios.get(`${API_URL}/habits/${habit._id}/history`);
                        if (histRes.data.history) {
                            allHistory.push(...histRes.data.history);
                        }
                    } catch (error) {
                        console.log(`No history for ${habit.name}`);
                    }
                }
                setHistory(allHistory);
            }
        } catch (error) {
            toast.error('Failed to load habits');
        } finally {
            setLoading(false);
        }
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
            setShowAddForm(false);
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

    // Calculate stats
    const completedToday = habits.filter(h => h.todayCompleted).length;
    const totalHabits = habits.length;
    const progress = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    const calculateStreak = () => {
        let streak = 0;
        // Group history by date and check if ALL habits were done each day
        if (history.length === 0 || habits.length === 0) return 0;
        
        const dateMap = {};
        history.forEach(day => {
            if (!dateMap[day.date]) dateMap[day.date] = [];
            dateMap[day.date].push(day.completed);
        });
        
        const dates = Object.keys(dateMap).sort();
        for (let i = dates.length - 1; i >= 0; i--) {
            const completions = dateMap[dates[i]];
            const allDone = completions.filter(c => c).length === habits.length;
            if (allDone) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };
    const streak = calculateStreak();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading habits...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex justify-end mb-6">
                {/* Share button removed */}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    icon="🔥" 
                    label="Current Streak" 
                    value={`${streak} days`}
                    subtext={streak === 0 ? "Start today!" : "Keep going!"}
                    color="bg-orange-50"
                />
                <StatCard 
                    icon="📊" 
                    label="Today's Progress" 
                    value={`${progress}%`}
                    subtext={`${completedToday}/${totalHabits} done`}
                    color="bg-blue-50"
                />
                <StatCard 
                    icon="🏆" 
                    label="Best Streak" 
                    value={`${streak} days`}
                    subtext="Keep pushing!"
                    color="bg-yellow-50"
                />
                <StatCard 
                    icon="✅" 
                    label="Total Habits" 
                    value={`${totalHabits}`}
                    subtext={totalHabits === 0 ? "Add your first!" : "Active habits"}
                    color="bg-green-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">📋 Your Habits</h2>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                {showAddForm ? 'Cancel' : '+ Add Habit'}
                            </button>
                        </div>

                        {showAddForm && (
                            <form onSubmit={createHabit} className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={newHabitName}
                                            onChange={(e) => setNewHabitName(e.target.value)}
                                            placeholder="Habit name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={newHabitDesc}
                                            onChange={(e) => setNewHabitDesc(e.target.value)}
                                            placeholder="Optional description"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm mt-2"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium self-start"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        )}

                        {habits.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="text-4xl block mb-3">🌟</span>
                                <p className="text-gray-500 text-sm">No habits yet</p>
                                <p className="text-gray-400 text-xs">Click "Add Habit" to get started</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {habits.map((habit) => (
                                    <div key={habit._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 text-sm truncate">
                                                {habit.name}
                                            </h3>
                                            {habit.description && (
                                                <p className="text-xs text-gray-400 truncate">{habit.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => toggleHabit(habit._id, habit.todayCompleted)}
                                                disabled={toggling === habit._id}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    habit.todayCompleted
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {habit.todayCompleted ? '✅ Done' : 'Mark Done'}
                                            </button>
                                            <button
                                                onClick={() => deleteHabit(habit._id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <MonthlyCalendar habits={habits} history={history} />
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        <p className="text-sm text-gray-700 italic">
                            "Small daily improvements over time lead to stunning results."
                        </p>
                        <p className="text-xs text-gray-400 mt-1">— Robin Sharma</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HabitsPage;