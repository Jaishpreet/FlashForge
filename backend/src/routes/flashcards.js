import express from 'express';
import axios from 'axios';
import FlashcardSet from '../models/FlashcardSet.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Generate flashcards using OpenRouter (FREE)
router.post('/generate', auth, async (req, res) => {
    try {
        const { text, topic } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        let cards = [];
        let usedAI = false;

        // === TRY OPENROUTER API ===
        try {
            console.log('📤 Attempting OpenRouter API...');
            
            const prompt = `Create 8-10 flashcards from this study material.
Each flashcard must have a clear QUESTION and a clear ANSWER.
Format EXACTLY like this for each card:

Q: What is photosynthesis?
A: The process by which plants convert light energy into chemical energy.

Q: What is the Calvin cycle?
A: The light-independent reactions of photosynthesis where CO2 is fixed into glucose.

Text to create flashcards from:
${text.substring(0, 2000)}

Now create 8-10 flashcards following the exact Q: / A: format above.`;

            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'meta-llama/llama-4-scout:free', // Free model
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a study assistant that creates high-quality flashcards. Always respond in Q: / A: format only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 800
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://flash-forge-769x.vercel.app',
                        'X-Title': 'FlashForge'
                    },
                    timeout: 45000
                }
            );

            console.log('✅ OpenRouter response received');

            const generatedText = response.data?.choices?.[0]?.message?.content || '';
            cards = parseFlashcards(generatedText);
            usedAI = true;
            console.log(`📊 AI generated ${cards.length} cards`);

        } catch (aiError) {
            console.log('❌ OpenRouter failed, using smart fallback:', aiError.message);
            // Fall through to smart generation
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
            message: usedAI ? '✨ Flashcards generated with OpenRouter AI!' : '📝 Flashcards generated from your text',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        
        // ULTIMATE FALLBACK
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

// === PARSE AI RESPONSE ===
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

// === SMART FALLBACK ===
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

// === GET /api/flashcards ===
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

// === GET /api/flashcards/:id ===
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

// === PATCH /api/flashcards/:id/study ===
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

// === DELETE /api/flashcards/:id ===
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