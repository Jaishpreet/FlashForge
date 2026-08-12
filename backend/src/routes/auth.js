import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js'; // ✅ IMPORTANT

const router = express.Router();

// ============================================================
// SIGNUP
// ============================================================

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// LOGIN
// ============================================================

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// UPDATE USERNAME
// ============================================================

router.put('/update-username', auth, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        const existingUser = await User.findOne({ 
            username: username.trim(),
            _id: { $ne: req.userId }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { username: username.trim() },
            { new: true }
        ).select('-password');

        res.json({ 
            message: 'Username updated successfully',
            user: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DELETE ACCOUNT
// ============================================================

router.delete('/delete-account', auth, async (req, res) => {
    try {
        // Delete user
        await User.findByIdAndDelete(req.userId);
        
        // Delete all habits and logs for this user
        // Note: This requires importing Habit and HabitLog models
        // Or you can handle it in the habits route
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;