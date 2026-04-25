import express from 'express';
import { generateReply, summarizeEmail, scheduleEvent } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/reply
// Body: { emailBody: string, intent?: string }
router.post('/reply', generateReply);

// POST /api/ai/summarize
// Body: { emailBody: string }
router.post('/summarize', summarizeEmail);

// POST /api/ai/schedule
// Body: { emailBody: string }
router.post('/schedule', scheduleEvent);

export default router;
