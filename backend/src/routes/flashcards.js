import express from 'express';
import FlashcardSet from '../models/FlashcardSet.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// GENERATE FLASHCARDS - NO API, JUST SMART TEXT PROCESSING
// ============================================================

router.post('/generate', auth, async (req, res) => {
    try {
        const { text, topic } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        console.log('📝 Generating flashcards from text...');

        // Generate flashcards directly from text
        let cards = generateSmartFlashcards(text);

        // Ensure we have 8-10 cards
        while (cards.length < 8) {
            cards.push({
                question: `What is discussed in "${text.substring(0, 40)}..."?`,
                answer: text.substring(40, 140) + '...'
            });
        }
        cards = cards.slice(0, 10);

        // Save to database
        const flashcardSet = new FlashcardSet({
            userId: req.userId,
            topic: topic || 'Untitled Set',
            sourceText: text,
            cards: cards
        });

        await flashcardSet.save();

        res.status(201).json({
            message: '📝 Flashcards generated successfully!',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// SMART FLASHCARD GENERATION (NO API)
// ============================================================

function generateSmartFlashcards(text) {
    const cards = [];
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const meaningfulSentences = sentences.filter(s => s.trim().length > 20);
    
    for (let i = 0; i < Math.min(meaningfulSentences.length - 1, 10); i += 1) {
        const sentence = meaningfulSentences[i].trim();
        const nextSentence = meaningfulSentences[i + 1]?.trim() || '';
        
        if (sentence.length < 15) continue;
        
        let question = `What is the meaning of: "${sentence}"?`;
        let answer = nextSentence || 'The text continues with more details.';
        
        if (answer.length < 20 && i + 2 < meaningfulSentences.length) {
            answer = meaningfulSentences.slice(i + 1, i + 3).join(' ');
        }
        
        cards.push({ question, answer });
    }
    
    if (cards.length < 5) {
        const chunks = splitIntoChunks(cleanText, 3);
        for (const chunk of chunks) {
            if (chunk.length > 30) {
                const midPoint = Math.floor(chunk.length / 2);
                const firstPart = chunk.substring(0, midPoint);
                const secondPart = chunk.substring(midPoint);
                cards.push({
                    question: `Explain the concept: "${firstPart.trim()}"`,
                    answer: secondPart.trim() || 'Continue reading the full text.'
                });
            }
        }
    }
    
    return cards;
}

function splitIntoChunks(text, chunkSize = 3) {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
}

// ============================================================
// GET ALL SETS
// ============================================================

router.get('/', auth, async (req, res) => {
    try {
        const sets = await FlashcardSet.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('topic cards createdAt studyCount');
        
        const formattedSets = sets.map(set => ({
            id: set._id,
            topic: set.topic,
            cardCount: set.cards.length,
            createdAt: set.createdAt,
            studyCount: set.studyCount || 0
        }));

        res.json(formattedSets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET ONE SET
// ============================================================

router.get('/:id', auth, async (req, res) => {
    try {
        const set = await FlashcardSet.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!set) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }

        res.json(set);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// UPDATE STUDY PROGRESS
// ============================================================

router.patch('/:id/study', auth, async (req, res) => {
    try {
        const set = await FlashcardSet.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { 
                $inc: { studyCount: 1 },
                $set: { lastStudied: new Date() }
            },
            { new: true }
        );

        if (!set) {
            return res.status(404).json({ error: 'Flashcard set not found' });
        }

        res.json({ message: 'Study progress updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DELETE A SET
// ============================================================

router.delete('/:id', auth, async (req, res) => {
    try {
        console.log(`🗑️ Attempting to delete set with ID: ${req.params.id}`);
        
        const deletedSet = await FlashcardSet.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!deletedSet) {
            return res.status(404).json({ 
                error: 'Flashcard set not found or you don\'t have permission to delete it' 
            });
        }

        console.log(`✅ Successfully deleted set: ${deletedSet.topic}`);
        res.json({ 
            message: 'Flashcard set deleted successfully',
            id: req.params.id,
            topic: deletedSet.topic
        });
    } catch (error) {
        console.error('❌ Delete error:', error.message);
        res.status(500).json({ 
            error: 'Failed to delete flashcard set',
            details: error.message 
        });
    }
});

export default router;