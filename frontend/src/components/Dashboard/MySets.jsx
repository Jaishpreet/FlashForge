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
                <div className="text-xl text-gray-600">Loading your sets...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Flashcard Sets</h1>
                <Link
                    to="/"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + New Set
                </Link>
            </div>

            {sets.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">You haven't created any flashcard sets yet.</p>
                    <Link
                        to="/"
                        className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Create your first set →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sets.map((set) => (
                        <div
                            key={set.id}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                                {set.topic}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                                <span>{set.cardCount} cards</span>
                                <span>•</span>
                                <span>Created {formatDistanceToNow(new Date(set.createdAt))} ago</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <Link
                                    to={`/study/${set.id}`}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Study →
                                </Link>
                                {set.studyCount > 0 && (
                                    <span className="text-sm text-gray-400">
                                        Studied {set.studyCount} times
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