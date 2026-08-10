import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const MySets = () => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/flashcards');
            setSets(response.data);
        } catch (error) {
            toast.error('Failed to load flashcard sets');
        } finally {
            setLoading(false);
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
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-indigo-200"
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySets;