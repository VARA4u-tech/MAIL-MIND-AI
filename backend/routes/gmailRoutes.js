import express from 'express';
import { getInbox, sendEmail } from '../controllers/gmailController.js';

const router = express.Router();

// GET /api/gmail/inbox?email=user@gmail.com
router.get('/inbox', getInbox);

// POST /api/gmail/send
router.post('/send', sendEmail);

export default router;
