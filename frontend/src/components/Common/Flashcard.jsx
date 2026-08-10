import React from 'react';

const Flashcard = ({ question, answer, isFlipped, onFlip }) => {
    return (
        <div 
            className="w-full max-w-2xl h-96 cursor-pointer perspective-1000"
            onClick={onFlip}
        >
            <div className={`relative w-full h-full transition-transform duration-600 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center border-2 border-indigo-100">
                    <span className="text-sm font-semibold text-indigo-600 mb-4">Question</span>
                    <p className="text-xl text-center text-gray-800 font-medium">
                        {question}
                    </p>
                    <span className="absolute bottom-4 text-sm text-gray-400">Click to flip</span>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center rotate-y-180 border-2 border-indigo-200">
                    <span className="text-sm font-semibold text-indigo-600 mb-4">Answer</span>
                    <p className="text-xl text-center text-gray-800">
                        {answer}
                    </p>
                    <span className="absolute bottom-4 text-sm text-gray-400">Click to flip back</span>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;