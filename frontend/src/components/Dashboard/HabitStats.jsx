import React from 'react';

// ============================================================
// STREAK COUNTER
// ============================================================

export const StreakCounter = ({ streak }) => {
    const fireSize = streak > 0 ? Math.min(30 + streak * 2, 70) : 20;
    const getMessage = () => {
        if (streak === 0) return "Start your streak today! 💪";
        if (streak < 3) return "Keep going! You're building momentum! 🌱";
        if (streak < 7) return "You're on fire! 🔥";
        if (streak < 14) return "Amazing consistency! ⭐";
        if (streak < 30) return "You're unstoppable! 🚀";
        return "LEGENDARY! You're a habit master! 👑";
    };

    return (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-orange-600">Current Streak</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-orange-700">{streak}</span>
                        <span className="text-sm text-gray-500 mb-1">days</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">{getMessage()}</p>
                </div>
                <span style={{ fontSize: `${fireSize}px` }}>🔥</span>
            </div>
        </div>
    );
};

// ============================================================
// DAILY PROGRESS BAR
// ============================================================

export const DailyProgress = ({ habits }) => {
    const total = habits.length;
    const completed = habits.filter(h => h.todayCompleted).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    const getMessage = () => {
        if (total === 0) return "Add a habit to get started! 🌟";
        if (percentage === 100) return "🎉 Perfect day! All habits done!";
        if (percentage >= 75) return "Almost there! Keep going! 💪";
        if (percentage >= 50) return "You're making progress! 🌱";
        if (percentage >= 25) return "Every step counts! 🚶";
        return "Let's get started! You can do this! ⭐";
    };

    const getColor = () => {
        if (percentage === 100) return 'from-green-400 to-green-600';
        if (percentage >= 75) return 'from-blue-400 to-indigo-600';
        if (percentage >= 50) return 'from-yellow-400 to-orange-500';
        return 'from-gray-400 to-gray-500';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                    Today's Progress
                </span>
                <span className="text-sm font-bold text-gray-900">
                    {completed}/{total} done
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                    className={`bg-gradient-to-r ${getColor()} h-3 rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{getMessage()}</p>
        </div>
    );
};

// ============================================================
// MOTIVATIONAL QUOTES
// ============================================================

export const MotivationalQuote = ({ completedCount, totalHabits }) => {
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
        { text: "It's not about being perfect. It's about being consistent.", author: "Unknown" },
        { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
        { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
        { text: "The best time to start was yesterday. The next best time is now.", author: "Unknown" },
        { text: "Success isn't always about greatness. It's about consistency.", author: "Dwayne Johnson" },
        { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
        { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" }
    ];

    // Get a quote based on progress
    const getQuote = () => {
        if (completedCount === 0 && totalHabits === 0) {
            return { text: "Add your first habit and start your journey! 🚀", author: "" };
        }
        if (completedCount === totalHabits && totalHabits > 0) {
            return { text: "You crushed it today! You're unstoppable! 🎉", author: "" };
        }
        const index = Math.floor(Math.random() * quotes.length);
        return quotes[index];
    };

    const quote = getQuote();

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-start gap-3">
                <span className="text-2xl">💭</span>
                <div>
                    <p className="text-gray-800 font-medium italic">"{quote.text}"</p>
                    {quote.author && (
                        <p className="text-sm text-gray-500 mt-1">— {quote.author}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// WEEKLY SUMMARY
// ============================================================

export const WeeklySummary = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📊</span>
                    <h3 className="font-semibold text-gray-900">Weekly Summary</h3>
                </div>
                <p className="text-sm text-gray-500">Complete some habits to see your weekly summary!</p>
            </div>
        );
    }

    // Get last 7 days
    const last7Days = history.slice(-7);
    const completed = last7Days.filter(d => d.completed).length;
    const percentage = Math.round((completed / last7Days.length) * 100);

    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = last7Days.map((day, index) => ({
        day: days[index % 7],
        completed: day.completed,
        date: day.date
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h3 className="font-semibold text-gray-900">Weekly Summary</h3>
                </div>
                <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2">
                {dayData.map((day, index) => (
                    <div key={index} className="text-center">
                        <div className={`text-xs font-medium ${
                            day.completed ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            {day.day}
                        </div>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                            day.completed 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 text-gray-400'
                        }`}>
                            {day.completed ? '✅' : '⬜'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 text-center text-xs text-gray-500">
                {completed} of {last7Days.length} days completed this week
            </div>
        </div>
    );
};