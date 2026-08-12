import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const Settings = () => {
    const { user, logout } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ============================================================
    // UPDATE USERNAME
    // ============================================================

    const handleUpdateUsername = async () => {
        if (!username.trim()) {
            toast.error('Username cannot be empty');
            return;
        }

        if (username.trim() === user?.username) {
            toast.info('Username unchanged');
            return;
        }

        setLoading(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            const response = await axios.put(
                `${API_URL}/auth/update-username`,
                { username: username.trim() },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Update user in localStorage and context
            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update the user in context (if you have a setUser function)
            // If you don't have setUser in your AuthContext, you can reload
            toast.success('Username updated! ✅');
            
            // Reload to reflect changes
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update username');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // EXPORT DATA AS CSV
    // ============================================================

    const handleExportData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`${API_URL}/habits/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = response.data;
            
            // Create CSV content
            let csvContent = 'Habit,Date,Completed\n';
            data.forEach(row => {
                csvContent += `${row.habitName},${row.date},${row.completed ? 'Yes' : 'No'}\n`;
            });

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `habit-data-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Data exported successfully! 📥');
        } catch (error) {
            toast.error('Failed to export data');
            console.error(error);
        }
    };

    // ============================================================
    // DELETE ACCOUNT
    // ============================================================

    const handleDeleteAccount = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            await axios.delete(`${API_URL}/auth/delete-account`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success('Account deleted successfully');
            logout();
            window.location.href = '/login';
        } catch (error) {
            toast.error('Failed to delete account');
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Settings</h1>

            {/* ============================================================
                PROFILE SECTION
            ============================================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">👤 Profile</h3>
                <div className="space-y-3">
                    {/* Username */}
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">Username</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter username"
                            />
                            <button
                                onClick={handleUpdateUsername}
                                disabled={loading}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                    {/* Email - Read Only */}
                    <div>
                        <label className="text-sm text-gray-500 block mb-1">Email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <span className="px-3 py-2 text-sm text-gray-400">Read-only</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                DATA MANAGEMENT
            ============================================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">📊 Data Management</h3>
                <div className="space-y-3">
                    {/* Export Data */}
                    <button
                        onClick={handleExportData}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left flex items-center gap-2"
                    >
                        <span>📥</span> Export All Data (CSV)
                        <span className="text-xs text-gray-400 ml-auto">Downloads your habit history</span>
                    </button>

                    {/* Delete Account */}
                    <div>
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-left flex items-center gap-2"
                            >
                                <span>🗑️</span> Delete Account
                                <span className="text-xs text-red-400 ml-auto">Permanently removes all data</span>
                            </button>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700 mb-2">
                                    ⚠️ Are you sure? This will delete ALL your habits, logs, and account data. This cannot be undone!
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                    >
                                        Yes, Delete Everything
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================
                ABOUT SECTION
            ============================================================ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">ℹ️ About</h3>
                <p className="text-sm text-gray-500">Version 1.0.0</p>
                <p className="text-sm text-gray-400 mt-1">Made with ❤️ by HabitFlow</p>
            </div>
        </div>
    );
};

export default Settings;