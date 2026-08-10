import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config';

const InputPage = () => {
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!text.trim()) {
            toast.error('Please enter some study material');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/flashcards/generate`,
                { text, topic: topic || 'Untitled Set' }
            );

            toast.success('✨ Flashcards forged successfully!');
            navigate(`/study/${response.data.setId}`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate flashcards');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                    <span className="text-3xl">⚡</span>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Forge Your Flashcards
                    </h1>
                </div>
                <p className="text-gray-600 mb-8">
                    Paste your study material below and let AI forge powerful flashcards for you.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                            Topic (Optional)
                        </label>
                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                            placeholder="e.g., Biology - Cell Division"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                            Study Material
                        </label>
                        <textarea
                            id="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-shadow"
                            placeholder="Paste your notes, textbook content, or any study material here..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Forging Flashcards...' : '⚡ Forge Flashcards'}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">💡 Pro Tip:</span> For best results, paste well-structured content 
                        with clear concepts. FlashForge AI will create 8-10 powerful flashcards from your material.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InputPage;