import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
});

const flashcardSetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    sourceText: {
        type: String,
        required: true
    },
    cards: [flashcardSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastStudied: {
        type: Date
    },
    studyCount: {
        type: Number,
        default: 0
    }
});

// Index for faster queries
flashcardSetSchema.index({ userId: 1, createdAt: -1 });

const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);
export default FlashcardSet;