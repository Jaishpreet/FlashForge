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

        let cards = [];

        try {
            // === STEP 1: Try Hugging Face API ===
            const prompt = `You are a study assistant. Create 8-10 flashcards from the text below.
            Each flashcard must have a clear QUESTION and a clear ANSWER.
            Format EXACTLY like this:
            
            Q: What is photosynthesis?
            A: The process by which plants convert light energy into chemical energy.
            
            Q: What is the Calvin cycle?
            A: The light-independent reactions of photosynthesis where CO2 is fixed into glucose.
            
            Text to create flashcards from:
            ${text.substring(0, 2000)}
            
            Now create 8-10 flashcards following the exact Q: / A: format above.`;

            console.log('📤 Sending request to Hugging Face...');

            const response = await axios.post(
                `https://api-inference.huggingface.co/models/google/flan-t5-base`,
                {
                    inputs: prompt,
                    parameters: {
                        max_length: 800,
                        temperature: 0.5,
                        do_sample: true,
                        num_return_sequences: 1
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
                    },
                    timeout: 45000 // 45 second timeout
                }
            );

            console.log('✅ Hugging Face response received');

            // Parse the response
            const generatedText = response.data[0]?.generated_text || '';
            cards = parseFlashcards(generatedText);

            console.log(`📊 Parsed ${cards.length} cards from AI response`);

        } catch (aiError) {
            console.error('❌ AI Error:', aiError.message);
            // Fallback to intelligent extraction
            cards = generateSmartFlashcards(req.body.text);
            console.log(`📊 Generated ${cards.length} cards using fallback`);
        }

        // === STEP 2: Ensure we have enough cards ===
        if (cards.length < 5) {
            console.log('⚠️ Not enough cards, using fallback...');
            cards = generateSmartFlashcards(req.body.text);
        }

        // === STEP 3: Ensure exactly 8-10 cards ===
        while (cards.length < 8) {
            cards.push({
                question: `What is the main idea of "${req.body.text.substring(0, 50)}..."?`,
                answer: req.body.text.substring(50, 150) + '...'
            });
        }
        cards = cards.slice(0, 10);

        // === STEP 4: Save to database ===
        const flashcardSet = new FlashcardSet({
            userId: req.userId,
            topic: topic || 'Untitled Set',
            sourceText: req.body.text,
            cards: cards
        });

        await flashcardSet.save();

        console.log(`💾 Saved ${cards.length} cards to database`);

        res.status(201).json({
            message: cards.length >= 8 ? '✨ Flashcards generated successfully!' : '📝 Flashcards generated with fallback method',
            setId: flashcardSet._id,
            cards: flashcardSet.cards,
            topic: flashcardSet.topic
        });

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        
        // Ultimate fallback
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

// === HELPER: Parse AI response into flashcards ===
function parseFlashcards(text) {
    const cards = [];
    const lines = text.split('\n');
    
    let currentQuestion = '';
    let currentAnswer = '';
    let readingQuestion = false;
    let readingAnswer = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('Q:') || trimmed.startsWith('Q:')) {
            // Save previous card if exists
            if (currentQuestion && currentAnswer) {
                cards.push({
                    question: currentQuestion.trim(),
                    answer: currentAnswer.trim()
                });
            }
            currentQuestion = trimmed.replace(/^Q:\s*/, '').trim();
            currentAnswer = '';
            readingQuestion = true;
            readingAnswer = false;
        } else if (trimmed.startsWith('A:') || trimmed.startsWith('A:')) {
            currentAnswer = trimmed.replace(/^A:\s*/, '').trim();
            readingQuestion = false;
            readingAnswer = true;
        } else if (readingQuestion && !trimmed.startsWith('A:')) {
            // Continue building question
            if (trimmed && !trimmed.match(/^\d+\./)) {
                currentQuestion += ' ' + trimmed;
            }
        } else if (readingAnswer && trimmed) {
            // Continue building answer
            if (trimmed && !trimmed.match(/^\d+\./)) {
                currentAnswer += ' ' + trimmed;
            }
        }
    }

    // Save last card
    if (currentQuestion && currentAnswer) {
        cards.push({
            question: currentQuestion.trim(),
            answer: currentAnswer.trim()
        });
    }

    return cards;
}

// === HELPER: Smart fallback (no AI needed) ===
function generateSmartFlashcards(text) {
    const cards = [];
    
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Group sentences into chunks of 2-3
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
        const chunk = sentences.slice(i, i + 2).join(' ');
        if (chunk.trim().length > 20) {
            chunks.push(chunk.trim());
        }
    }

    // Generate flashcards from chunks
    for (let i = 0; i < Math.min(chunks.length, 10); i++) {
        const chunk = chunks[i];
        if (chunk.length > 30) {
            // Split the chunk into two parts
            const midPoint = Math.floor(chunk.length / 2);
            const firstPart = chunk.substring(0, midPoint);
            const secondPart = chunk.substring(midPoint);
            
            // Create question and answer
            const question = `What does "${firstPart.trim()}" refer to?`;
            const answer = secondPart.trim();
            
            cards.push({ question, answer });
        }
    }

    // If no cards generated, create generic ones
    if (cards.length === 0) {
        const words = text.split(' ');
        for (let i = 0; i < Math.min(8, Math.floor(words.length / 5)); i++) {
            const start = i * 5;
            const end = Math.min(start + 5, words.length);
            const phrase = words.slice(start, end).join(' ');
            cards.push({
                question: `What is the meaning of "${phrase}"?`,
                answer: `This phrase relates to: ${text.substring(0, 100)}...`
            });
        }
    }

    return cards;
}

// === GET /api/flashcards - List user's saved sets ===
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

// === GET /api/flashcards/:id - Get one full set for studying ===
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

// === PATCH /api/flashcards/:id/study - Update study progress ===
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