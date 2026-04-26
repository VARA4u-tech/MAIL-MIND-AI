import express from 'express';
import { getInbox, sendEmail, searchEmailsAI } from '../controllers/gmailController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection to all Gmail routes
router.use(protect);

// GET /api/gmail/inbox (Email retrieved from token)
router.get('/inbox', getInbox);

// GET /api/gmail/search
router.get('/search', searchEmailsAI);

// POST /api/gmail/send
router.post('/send', sendEmail);

export default router;
