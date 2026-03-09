const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new admin user.
 * Only allows one admin user to exist.
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if an admin already exists
        const existingUser = await User.findOne();
        if (existingUser) {
            return res.status(400).json({ message: 'Admin user already exists. Only one admin is allowed.' });
        }

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Create user
        const user = await User.create({ username, password });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Admin registered successfully',
            token,
            user: { id: user._id, username: user.username },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Login with username and password, returns JWT token.
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
