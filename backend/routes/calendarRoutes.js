import express from 'express';
import { createEvent } from '../controllers/calendarController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection to all calendar routes
router.use(protect);

// POST /api/calendar/create-event
router.post('/create-event', createEvent);

export default router;
