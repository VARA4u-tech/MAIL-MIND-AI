import OpenAI from "openai";
import Summary from "../models/Summary.js";
import { google } from "googleapis";
import { getClientForUser } from "./authController.js";
import User from "../models/User.js";
import { extractBody } from "../utils/gmailUtils.js";

// Helper to check and deduct credits
export const checkCredits = async (userEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  if (user.aiCredits === undefined || !user.creditsResetAt) {
    user.aiCredits = 50;
    user.creditsResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await user.save();
  } else if (now > user.creditsResetAt) {
    user.aiCredits = 50;
    user.creditsResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await user.save();
  }
  
  if (user.aiCredits <= 0) {
    const error = new Error("AI credits exhausted.");
    error.status = 402;
    error.creditsResetAt = user.creditsResetAt;
    throw error;
  }
  
  return user;
};

export const deductCredit = async (user, amount = 1) => {
  user.aiCredits -= amount;
  await user.save();
  return { aiCredits: user.aiCredits, creditsResetAt: user.creditsResetAt };
};
// Utility to strip HTML tags for AI consumption
const stripHtml = (html) => {
  if (!html) return "";
  // Remove script and style elements entirely
  let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  clean = clean.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
  // Strip all other tags
  clean = clean.replace(/<[^>]*>?/gm, " ");
  // Consolidate whitespace
  return clean.replace(/\s+/g, " ").trim();
};

// Truncate text to save input tokens (keeps costs low)
const truncateText = (text, maxChars = 1500) => {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "... [truncated for brevity]";
};

// Max output tokens — stay under free-tier credit limit
const MAX_TOKENS = 600;

// Initialize OpenAI client pointing to OpenRouter
export const getOpenRouterClient = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is missing");

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:8080",
      "X-Title": "MailMind AI",
    },
  });
};

// All available free models — spread load across all of them
const OPENROUTER_MODELS = [
  "cohere/north-mini-code:free",
];

// Groq free models — 14,400 requests/day each (much better limits)
const GROQ_MODELS = [
  "canopylabs/orpheus-arabic-saudi",
  "canopylabs/orpheus-v1-english",
  "meta-llama/llama-prompt-guard-2-86m",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-safeguard-20b",
  "qwen/qwen3.8-27b",
];
// Groq client — primary if GROQ_API_KEY is set
export const getGroqClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: key,
  });
};

// ─── Response Cache (in-memory, 30-min TTL) ───────────────────────────────────
// Prevents duplicate API calls for the same email + mode combination
const responseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const getCachedResponse = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCachedResponse = (key, value) => {
  responseCache.set(key, { value, timestamp: Date.now() });
  // Keep cache size bounded
  if (responseCache.size > 200) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
};

// Round-robin index — distributes requests equally across all models
let rrIndex = 0;
let groqRrIndex = 0;

// ─── Per-User Rate Limiter (in-memory) ───────────────────────────────────────
// Tracks: { count: number, windowStart: Date, blockedUntil: Date | null }
const userRateLimitMap = new Map();
const RATE_LIMIT_MAX      = 5;          // max requests
const RATE_LIMIT_WINDOW   = 5 * 60 * 1000; // 5-minute window
const RATE_LIMIT_BLOCK    = 5 * 60 * 1000; // 5-minute cooldown

export const checkUserRateLimit = (userEmail) => {
  const now = Date.now();
  let entry = userRateLimitMap.get(userEmail);

  if (!entry) {
    entry = { count: 0, windowStart: now, blockedUntil: null };
    userRateLimitMap.set(userEmail, entry);
  }

  // Still blocked?
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const remaining = Math.ceil((entry.blockedUntil - now) / 1000);
    const error = new Error(`Too many requests. Please wait ${remaining} seconds before trying again.`);
    error.status = 429;
    error.retryAfter = entry.blockedUntil;
    throw error;
  }

  // Reset window if expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.windowStart = now;
    entry.blockedUntil = null;
  }

  // Increment and check
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK;
    const error = new Error(`You've made ${RATE_LIMIT_MAX} requests in 5 minutes. AI features are paused for 5 minutes to balance usage. Please try again later.`);
    error.status = 429;
    error.retryAfter = entry.blockedUntil;
    throw error;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

// Completion handler — Tries Groq first (high limits), falls back to OpenRouter
export const getCompletion = async (
  openai, // kept for signature compatibility, may be null
  messages,
  temperature = 0.7,
) => {
  // 1. Try Groq first if API key is available (14,400 req/day free)
  const groqClient = getGroqClient();
  if (groqClient) {
    const startIndex = groqRrIndex % GROQ_MODELS.length;
    for (let i = 0; i < GROQ_MODELS.length; i++) {
      const idx = (startIndex + i) % GROQ_MODELS.length;
      const model = GROQ_MODELS[idx];
      try {
        console.log(`AI Strategy: Trying Groq ${model}...`);
        const response = await groqClient.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: MAX_TOKENS,
        });
        groqRrIndex = (idx + 1) % GROQ_MODELS.length;
        console.log(`AI Strategy: Groq ${model} succeeded ✓`);
        return response;
      } catch (error) {
        console.error(`AI Strategy: Groq ${model} failed - ${error.message}`);
      }
    }
  }

  // 2. Fallback to OpenRouter free models
  const orClient = openai || getOpenRouterClient();
  let lastError = null;
  const startIndex = rrIndex % OPENROUTER_MODELS.length;

  for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
    const idx = (startIndex + i) % OPENROUTER_MODELS.length;
    const model = OPENROUTER_MODELS[idx];
    try {
      console.log(`AI Strategy: Trying OpenRouter ${model} (slot ${idx + 1}/${OPENROUTER_MODELS.length})...`);
      const response = await orClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: MAX_TOKENS,
      });
      rrIndex = (idx + 1) % OPENROUTER_MODELS.length;
      return response;
    } catch (error) {
      console.error(`AI Strategy: ${model} failed - ${error.message}`);
      lastError = error;
    }
  }

  const status = lastError?.status || (lastError?.message?.includes("429") ? 429 : (lastError?.message?.includes("402") ? 402 : 500));
  
  let friendlyMessage = `AI models are temporarily unavailable. Please try again later.`;
  if (status === 429) {
    friendlyMessage = "The AI service is currently busy or experiencing high traffic. Please wait a moment and try again.";
  } else if (status === 402) {
    friendlyMessage = "AI service credits are exhausted. Please try again when credits reset.";
  }

  const finalError = new Error(friendlyMessage);
  finalError.status = status;
  throw finalError;
};

// Feature 1: Smart Reply Generation
export const generateReply = async (req, res) => {
  const { emailBody, intent = "polite", metadata } = req.body;
  const userEmail = req.user.email; // Use email from token

  if (!emailBody)
    return res.status(400).json({ error: "emailBody is required" });

  try {
    // Rate limit check first
    checkUserRateLimit(userEmail);

    const cleanBody = truncateText(stripHtml(emailBody));
    
    // Check cache first — same email + intent = same reply
    const cacheKey = `reply:${userEmail}:${intent}:${cleanBody.slice(0, 100)}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('AI Cache hit: reply');
      return res.json({ reply: cached, aiCredits: null, creditsResetAt: null, cached: true });
    }

    const openai = getOpenRouterClient();
    const userRecord = await checkCredits(userEmail);

    const completion = await getCompletion(openai, [
      {
        role: "system",
        content: `You are MailMind AI. Generate a concise professional email reply based on this intent: "${intent}". Output ONLY the email body. Be brief.`,
      },
      {
        role: "user",
        content: cleanBody,
      },
    ]);

    const result = (completion.choices[0]?.message?.content || "").trim();
    setCachedResponse(cacheKey, result);
    const { aiCredits, creditsResetAt } = await deductCredit(userRecord, 1);

    // Save to History if metadata is provided
    if (metadata && metadata.emailId) {
      await Summary.create({
        userEmail: userEmail, // Store authenticated email
        emailId: metadata.emailId,
        subject: metadata.subject,
        from: metadata.from,
        originalContent: emailBody,
        aiResult: result,
        type: 'reply',
      });
    }

    res.json({ reply: result, aiCredits, creditsResetAt });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, retryAfter: error.retryAfter });
    }
    if (error.status === 402) {
      return res.status(402).json({ error: error.message, creditsResetAt: error.creditsResetAt });
    }
    res.status(500).json({ error: "AI Generation Failed", details: error.message });
  }
};

// Feature 2: Email Summarization
export const summarizeEmail = async (req, res) => {
  const { emailBody, metadata } = req.body;
  const userEmail = req.user.email;

  if (!emailBody)
    return res.status(400).json({ error: "emailBody is required" });

  try {
    // Rate limit check first
    checkUserRateLimit(userEmail);

    const cleanBody = truncateText(stripHtml(emailBody));
    
    // Check cache first — same email body = same summary
    const cacheKey = `summary:${userEmail}:${cleanBody.slice(0, 100)}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('AI Cache hit: summary');
      return res.json({ summary: cached, aiCredits: null, creditsResetAt: null, cached: true });
    }

    const openai = getOpenRouterClient();
    const userRecord = await checkCredits(userEmail);

    const completion = await getCompletion(
      openai,
      [
        {
          role: "system",
          content: "Summarize this email in 3 short bullet points. Be concise.",
        },
        {
          role: "user",
          content: cleanBody,
        },
      ],
      0.3,
    );

    const result = (completion.choices[0]?.message?.content || "").trim();
    setCachedResponse(cacheKey, result);
    const { aiCredits, creditsResetAt } = await deductCredit(userRecord, 1);

    // Save to History if metadata is provided
    if (metadata && metadata.emailId) {
      await Summary.create({
        userEmail: userEmail,
        emailId: metadata.emailId,
        subject: metadata.subject,
        from: metadata.from,
        originalContent: emailBody,
        aiResult: result,
        type: 'summary',
      });
    }

    res.json({ summary: result, aiCredits, creditsResetAt });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, retryAfter: error.retryAfter });
    }
    if (error.status === 402) {
      return res.status(402).json({ error: error.message, creditsResetAt: error.creditsResetAt });
    }
    res.status(500).json({ error: "Failed to summarize", details: error.message });
  }
};

// Feature 3: Schedule Extraction
export const scheduleEvent = async (req, res) => {
  const { emailBody, metadata } = req.body;
  const userEmail = req.user.email;

  if (!emailBody)
    return res.status(400).json({ error: "emailBody is required" });

  try {
    // Rate limit check first
    checkUserRateLimit(userEmail);

    const openai = getOpenRouterClient();
    const cleanBody = truncateText(stripHtml(emailBody));
    const now = new Date().toISOString();
    
    const userRecord = await checkCredits(userEmail);

    const completion = await getCompletion(
      openai,
      [
        {
          role: "system",
          content: `You are a calendar assistant. Extract meeting details from the email below and return ONLY a raw valid JSON object with NO markdown, NO code fences, NO extra text.
          Current Time: ${now}
          
          JSON Structure (all fields are required):
          {
            "title": "Meeting title (use subject if unclear)",
            "description": "A brief 1-2 sentence note summarizing the purpose of the meeting or key context from the email",
            "location": "Physical address OR Zoom/Google Meet/Teams link. If not found, write 'To be confirmed'",
            "startDate": "YYYYMMDDTHHMMSSZ",
            "endDate": "YYYYMMDDTHHMMSSZ"
          }
          
          Rules:
          - ALWAYS extract or infer a meaningful description/note from the email body.
          - For location, thoroughly scan for Zoom links, Google Meet links, Microsoft Teams links, or any physical address.
          - If no location is found, write exactly: "To be confirmed"
          - If no date is found, use the current time above.
          - Return ONLY the JSON object. No other text.`,
        },
        {
          role: "user",
          content: cleanBody,
        },
      ],
      0,
    );

    let output = (completion.choices[0]?.message?.content || "").trim();
    output = output.replace(/```json\n?|\n?```/g, "");
    
    try {
      const parsed = JSON.parse(output);
      const { aiCredits, creditsResetAt } = await deductCredit(userRecord, 1);

      // Meeting is saved to DB by calendarController after Google Calendar creation
      res.json({ ...parsed, aiCredits, creditsResetAt });
    } catch (parseErr) {
      console.error("Manual JSON Parse Error:", output, parseErr);
      res.status(500).json({ error: "AI returned invalid JSON format", details: output });
    }
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, retryAfter: error.retryAfter });
    }
    if (error.status === 402) {
      return res.status(402).json({ error: error.message, creditsResetAt: error.creditsResetAt });
    }
    res.status(500).json({ error: "Failed to extract schedule", details: error.message });
  }
};

// Feature 4: Get AI History
export const getHistory = async (req, res) => {
  const userEmail = req.user.email;

  try {
    const history = await Summary.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history", details: error.message });
  }
};

// Feature: Delete AI History
export const deleteHistory = async (req, res) => {
  const userEmail = req.user.email;
  const { id } = req.query; // optional specific id

  try {
    if (id) {
      await Summary.findOneAndDelete({ _id: id, userEmail });
    } else {
      await Summary.deleteMany({ userEmail });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete history", details: error.message });
  }
};

// Feature: Get AI Credits
export const getCredits = async (req, res) => {
  const userEmail = req.user.email;
  try {
    const user = await checkCredits(userEmail);
    res.json({ aiCredits: user.aiCredits, creditsResetAt: user.creditsResetAt });
  } catch (error) {
    if (error.status === 402) {
      res.json({ aiCredits: 0, creditsResetAt: error.creditsResetAt });
    } else {
      res.status(500).json({ error: "Failed to fetch credits", details: error.message });
    }
  }
};
// Feature 5: Bulk Summarization
export const summarizeBulk = async (req, res) => {
  const { emailIds } = req.body;
  const userEmail = req.user.email;

  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: "At least one email ID is required" });
  }

  try {
    const userRecord = await checkCredits(userEmail);
    const authClient = await getClientForUser(userEmail);
    const gmail = google.gmail({ version: "v1", auth: authClient });

    // Fetch all selected email bodies
    const emailContents = await Promise.all(
      emailIds.map(async (id) => {
        const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
        const headers = msg.data.payload.headers;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
        const body = extractBody(msg.data.payload);
        const cleanBody = truncateText(stripHtml(body), 800); // tighter limit per email in bulk mode
        return `FROM: ${from}\nSUBJECT: ${subject}\nCONTENT: ${cleanBody}\n---`;
      })
    );

    const openai = getOpenRouterClient();
    const completion = await getCompletion(
      openai,
      [
        {
          role: "system",
          content: `You are an executive assistant. Generate a single cohesive summary (a "Daily Brief") of all the provided emails. 
          Group related topics together. Focus on action items, deadlines, and key decisions. 
          Keep the total summary under 500 words. Use bullet points for clarity.`,
        },
        {
          role: "user",
          content: emailContents.join("\n\n"),
        },
      ],
      0.5,
    );

    const bulkSummary = (completion.choices[0]?.message?.content || "").trim();
    const { aiCredits, creditsResetAt } = await deductCredit(userRecord, 1);

    // Save to History as a bulk record
    await Summary.create({
      userEmail: userEmail,
      emailId: "bulk_" + Date.now(),
      subject: `Daily Brief: ${emailIds.length} Emails`,
      from: "MailMind AI",
      originalContent: `Summarized IDs: ${emailIds.join(", ")}`,
      aiResult: bulkSummary,
      type: "summary",
    });

    res.json({ summary: bulkSummary, aiCredits, creditsResetAt });
  } catch (error) {
    if (error.status === 402) {
      return res.status(402).json({ error: error.message, creditsResetAt: error.creditsResetAt });
    }
    console.error("Bulk Summary Error:", error);
    res.status(500).json({ error: "Failed to generate bulk summary", details: error.message });
  }
};
