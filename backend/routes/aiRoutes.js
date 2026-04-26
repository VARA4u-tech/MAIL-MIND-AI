import express from 'express';
import { generateReply, summarizeEmail, scheduleEvent, getHistory, summarizeBulk } from '../controllers/aiController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection to all AI routes
router.use(protect);

// POST /api/ai/reply
router.post('/reply', generateReply);

// POST /api/ai/summarize
router.post('/summarize', summarizeEmail);

// POST /api/ai/summarize-bulk
router.post('/summarize-bulk', summarizeBulk);

// POST /api/ai/schedule
router.post('/schedule', scheduleEvent);

// GET /api/ai/history
router.get('/history', getHistory);

export default router;
