import express from 'express';
import axios from 'axios';
import FlashcardSet from '../models/FlashcardSet.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Generate flashcards using FREE Hugging Face API
router.post('/generate', auth, async (req, res) => {
    try {
        const { text, topic } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        // Prepare prompt for AI
        const prompt = `Generate 8-10 flashcards from this study material. 
        Each flashcard must have a question and answer.
        Format each as: Q: question? A: answer.
        
        Study Material:
        ${text.substring(0, 1500)}
        
        Generate flashcards:`;

        // Call Hugging Face API (FREE)
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/google/flan-t5-base`,
            {
                inputs: prompt,
                parameters: {
                    max_length: 800,
                    temperature: 0.7,
                    do_sample: true
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
                }
            }
        );

        // Parse AI response
        const generatedText = response.data[0]?.generated_text || '';
        let cards = parseFlashcards(generatedText);

        // If parsing fails or not enough cards, use fallback
        if (cards.length < 5) {
            cards = generateFallbackCards(text);
        }

        // Ensure we have 8-10 cards
        while (cards.length < 8) {
            cards.push({
                question: `What is a key concept from: "${text.substring(0, 30)}..."?`,
                answer: text.substring(30, 100) + '...'
            });
        }
        cards = cards.slice(0, 10);

        // Save to database (EXACTLY as you requested)
        const flashcardSet = new FlashcardSet({
            userId: req.userId,
            topic: topic || 'Untitled Set',
            sourceText: text,
            cards: cards
        });

        await flashcardSet.save();

        res.status(201).json({
            message: '✨ Flashcards generated successfully',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });

    } catch (error) {
        console.error('Error generating flashcards:', error.message);
        
        // Fallback: Generate basic flashcards without AI
        const fallbackCards = generateFallbackCards(req.body.text);
        
        const flashcardSet = new FlashcardSet({
            userId: req.userId,
            topic: req.body.topic || 'Untitled Set',
            sourceText: req.body.text,
            cards: fallbackCards
        });

        await flashcardSet.save();

        res.status(201).json({
            message: '🔄 Flashcards generated with fallback method',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });
    }
});

// Helper: Parse AI response into flashcards
function parseFlashcards(text) {
    const cards = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('Q:') && trimmed.includes('A:')) {
            const qMatch = trimmed.match(/Q:\s*(.*?)\s*A:/);
            const aMatch = trimmed.match(/A:\s*(.*)/);
            
            if (qMatch && aMatch) {
                cards.push({
                    question: qMatch[1].trim(),
                    answer: aMatch[1].trim()
                });
            }
        }
    }
    return cards;
}

// Fallback: Generate flashcards from text (no AI needed)
function generateFallbackCards(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const cards = [];
    
    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
        const sentence = sentences[i].trim();
        if (sentence.length > 10) {
            const words = sentence.split(' ');
            const midPoint = Math.floor(words.length / 2);
            const firstPart = words.slice(0, midPoint).join(' ');
            const secondPart = words.slice(midPoint).join(' ');
            
            cards.push({
                question: `Explain the meaning of: "${firstPart}"?`,
                answer: secondPart || 'Continue reading the material for the full context.'
            });
        }
    }
    
    // If still no cards, add generic ones
    if (cards.length === 0) {
        cards.push({
            question: `What is the main topic of this text?`,
            answer: text.substring(0, 100) + '...'
        });
        cards.push({
            question: `What is a key concept mentioned?`,
            answer: `The text discusses ${text.split(' ').slice(0, 10).join(' ')}...`
        });
    }
    
    return cards;
}

// GET /api/flashcards - List user's saved sets
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

// GET /api/flashcards/:id - Get one full set for studying
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

// PATCH /api/flashcards/:id/study - Update study progress
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

export default router;