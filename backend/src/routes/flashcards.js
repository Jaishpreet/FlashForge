import express from 'express';
import axios from 'axios';
import FlashcardSet from '../models/FlashcardSet.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// 1. GENERATE FLASHCARDS
// ============================================================
router.post('/generate', auth, async (req, res) => {
    try {
        const { text, topic } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        let cards = [];
        let usedAI = false;

        // === TRY HUGGING FACE API ===
        try {
            console.log('📤 Attempting Hugging Face API...');
            
            const prompt = `Create 8-10 flashcards from this text. 
            Format EXACTLY as:
            Q: question?
            A: answer
            
            Text: ${text.substring(0, 1500)}`;

            const response = await axios.post(
                `https://api-inference.huggingface.co/models/google/flan-t5-base`,
                {
                    inputs: prompt,
                    parameters: {
                        max_length: 800,
                        temperature: 0.5,
                        do_sample: true
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
                    },
                    timeout: 30000
                }
            );

            const generatedText = response.data[0]?.generated_text || '';
            cards = parseFlashcards(generatedText);
            usedAI = true;
            console.log(`✅ AI generated ${cards.length} cards`);

        } catch (aiError) {
            console.log('❌ AI failed, using smart fallback:', aiError.message);
        }

        // === SMART FALLBACK (No API needed) ===
        if (cards.length < 5) {
            console.log('📝 Generating smart flashcards from text...');
            cards = generateSmartFlashcards(text);
            usedAI = false;
        }

        // === ENSURE 8-10 CARDS ===
        while (cards.length < 8) {
            cards.push({
                question: `What is discussed in "${text.substring(0, 40)}..."?`,
                answer: text.substring(40, 140) + '...'
            });
        }
        cards = cards.slice(0, 10);

        // === SAVE TO DATABASE ===
        const flashcardSet = new FlashcardSet({
            userId: req.userId,
            topic: topic || 'Untitled Set',
            sourceText: text,
            cards: cards
        });

        await flashcardSet.save();

        res.status(201).json({
            message: usedAI ? '✨ Flashcards generated with AI!' : '📝 Flashcards generated from your text',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        
        const fallbackCards = generateSmartFlashcards(req.body.text);
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

// ============================================================
// HELPER: Parse AI Response
// ============================================================
function parseFlashcards(text) {
    const cards = [];
    const lines = text.split('\n');
    
    let currentQ = '';
    let currentA = '';
    let readingQ = false;
    let readingA = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('Q:')) {
            if (currentQ && currentA) {
                cards.push({ question: currentQ.trim(), answer: currentA.trim() });
            }
            currentQ = trimmed.replace(/^Q:\s*/, '').trim();
            currentA = '';
            readingQ = true;
            readingA = false;
        } else if (trimmed.startsWith('A:')) {
            currentA = trimmed.replace(/^A:\s*/, '').trim();
            readingQ = false;
            readingA = true;
        } else if (readingQ && trimmed) {
            currentQ += ' ' + trimmed;
        } else if (readingA && trimmed) {
            currentA += ' ' + trimmed;
        }
    }

    if (currentQ && currentA) {
        cards.push({ question: currentQ.trim(), answer: currentA.trim() });
    }

    return cards;
}

// ============================================================
// HELPER: Smart Fallback (No API)
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
        
        let question = sentence;
        let answer = nextSentence || 'The text continues with more details.';
        
        if (!question.endsWith('?')) {
            question = `What is the meaning of: "${question}"?`;
        }
        
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
// 2. GET ALL SETS - /api/flashcards
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
// 3. GET ONE SET - /api/flashcards/:id
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
// 4. UPDATE STUDY PROGRESS - /api/flashcards/:id/study
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
// 5. DELETE A SET - /api/flashcards/:id  ✅ THIS IS YOUR DELETE ROUTE
// ============================================================
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log(`🗑️ Attempting to delete set with ID: ${req.params.id}`);
        console.log(`👤 User ID: ${req.userId}`);
        
        const deletedSet = await FlashcardSet.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!deletedSet) {
            console.log(`❌ Set not found or doesn't belong to user`);
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