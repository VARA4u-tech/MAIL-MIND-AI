import express from 'express';
import { getInbox, sendEmail } from '../controllers/gmailController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection to all Gmail routes
router.use(protect);

// GET /api/gmail/inbox (Email retrieved from token)
router.get('/inbox', getInbox);

// POST /api/gmail/send
router.post('/send', sendEmail);

export default router;
