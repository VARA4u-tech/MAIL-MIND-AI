import express from 'express';
import { startAuth, handleCallback, logout } from '../controllers/authController.js';

const router = express.Router();

// GET /auth/google — Redirect user to Google OAuth consent screen
router.get('/google', startAuth);

// POST /api/auth/logout — Clear the session cookie
router.post('/logout', logout);

// GET /api/auth/google/callback — Google redirects here after consent
router.get('/callback/google', handleCallback);

export default router;
