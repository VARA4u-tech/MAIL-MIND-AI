import express from 'express';
import { generateReply, summarizeEmail } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/reply
// Body: { emailBody: string, intent?: string }
router.post('/reply', generateReply);

// POST /api/ai/summarize
// Body: { emailBody: string }
router.post('/summarize', summarizeEmail);

export default router;
