import express from 'express';
import { generateReply, summarizeEmail, scheduleEvent, getHistory } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/reply
// Body: { emailBody: string, intent?: string, metadata: { userEmail, emailId, subject, from } }
router.post('/reply', generateReply);

// POST /api/ai/summarize
// Body: { emailBody: string, metadata: { userEmail, emailId, subject, from } }
router.post('/summarize', summarizeEmail);

// POST /api/ai/schedule
// Body: { emailBody: string, metadata: { userEmail, emailId, subject, from } }
router.post('/schedule', scheduleEvent);

// GET /api/ai/history?email=...
router.get('/history', getHistory);

export default router;
