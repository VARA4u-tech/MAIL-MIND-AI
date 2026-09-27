import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import gmailRoutes from './routes/gmailRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import connectDB from './config/db.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://127.0.0.1:8080',
].filter(Boolean);

// Security Firewall Middleware
app.use(helmet()); // Sets various HTTP headers for security

// Rate Limiting Firewall
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter); // Apply to all API routes

// Standard Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/calendar', calendarRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('MailMind AI Backend is running with Firewall Protection...');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy and protected' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} with Firewall protection enabled`);
});
