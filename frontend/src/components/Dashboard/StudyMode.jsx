import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Flashcard from '../Common/Flashcard';

const StudyMode = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [set, setSet] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSet();
    }, [id]);

    const fetchSet = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/flashcards/${id}`);
            setSet(response.data);
            
            // Update study count
            await axios.patch(`http://localhost:5000/api/flashcards/${id}/study`);
        } catch (error) {
            toast.error('Failed to load flashcard set');
            navigate('/sets');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < set.cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading flashcards...</div>
            </div>
        );
    }

    if (!set || !set.cards || set.cards.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">No flashcards found</h1>
                <p className="text-gray-600">This set doesn't have any cards.</p>
                <button
                    onClick={() => navigate('/sets')}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Back to my sets →
                </button>
            </div>
        );
    }

    const currentCard = set.cards[currentIndex];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{set.topic}</h1>
                <p className="text-gray-500">
                    Card {currentIndex + 1} of {set.cards.length}
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <Flashcard
                    question={currentCard.question}
                    answer={currentCard.answer}
                    isFlipped={isFlipped}
                    onFlip={handleFlip}
                />
            </div>

            <div className="flex justify-center space-x-4">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={handleFlip}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Flip Card
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === set.cards.length - 1}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate('/sets')}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    ← Back to my sets
                </button>
            </div>
        </div>
    );
};

export default StudyMode;