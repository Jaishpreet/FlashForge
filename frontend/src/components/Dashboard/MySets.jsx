import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '../../config';

const MySets = () => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const response = await axios.get(`${API_URL}/flashcards`);
            setSets(response.data);
        } catch (error) {
            toast.error('Failed to load flashcard sets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, topic) => {
        // Confirm with user
        if (!window.confirm(`Are you sure you want to delete "${topic}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(id);
        try {
            await axios.delete(`${API_URL}/flashcards/${id}`);
            // Remove from UI
            setSets(sets.filter(set => set.id !== id));
            toast.success(`"${topic}" deleted successfully!`);
        } catch (error) {
            console.error('Delete error:', error);
            if (error.response?.status === 404) {
                toast.error('Set not found. Refreshing list...');
                fetchSets();
            } else {
                toast.error(error.response?.data?.error || 'Failed to delete flashcard set');
            }
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading your flashcards...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                    <span className="text-3xl">📚</span>
                    <h1 className="text-3xl font-bold text-gray-900">My FlashForge Sets</h1>
                </div>
                <Link
                    to="/"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-[1.02]"
                >
                    + Forge New Set
                </Link>
            </div>

            {sets.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-dashed border-indigo-200">
                    <span className="text-6xl block mb-4">⚡</span>
                    <p className="text-gray-600 text-lg">You haven't forged any flashcard sets yet.</p>
                    <Link
                        to="/"
                        className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        Forge your first set →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sets.map((set) => (
                        <div
                            key={set.id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-indigo-200 relative group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-xl font-semibold text-gray-900 truncate flex-1">
                                    {set.topic}
                                </h3>
                                <span className="text-2xl ml-2">📝</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                                <span className="flex items-center">
                                    <span className="mr-1">🃏</span>
                                    {set.cardCount} cards
                                </span>
                                <span>•</span>
                                <span>Created {formatDistanceToNow(new Date(set.createdAt))} ago</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <Link
                                    to={`/study/${set.id}`}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                >
                                    Study Now →
                                </Link>
                                {set.studyCount > 0 && (
                                    <span className="text-sm text-gray-400">
                                        🔄 Studied {set.studyCount} times
                                    </span>
                                )}
                            </div>
                            
                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(set.id, set.topic)}
                                disabled={deletingId === set.id}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 p-1.5 rounded-full"
                                title="Delete this set"
                            >
                                {deletingId === set.id ? (
                                    <span className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySets;