import OpenAI from "openai";
import Summary from "../models/Summary.js";
import { google } from "googleapis";
import { getClientForUser } from "./authController.js";
import { extractBody } from "../utils/gmailUtils.js";

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

// Locked to your specified Gemma model only
const MODELS = [
  "google/gemma-2-27b-it", 
];

// Completion handler
export const getCompletion = async (
  openai,
  messages,
  temperature = 0.7,
) => {
  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`AI Strategy: Executing with ${model}...`);
      const response = await openai.chat.completions.create({
        model: model,
        messages,
        temperature,
      });
      return response;
    } catch (error) {
      console.error(`AI Strategy: ${model} failed - ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`AI model error: ${lastError?.message}`);
};

// Feature 1: Smart Reply Generation
export const generateReply = async (req, res) => {
  const { emailBody, intent = "polite", metadata } = req.body;
  const userEmail = req.user.email; // Use email from token

  if (!emailBody)
    return res.status(400).json({ error: "emailBody is required" });

  try {
    const openai = getOpenRouterClient();
    const completion = await getCompletion(openai, [
      {
        role: "system",
        content: `You are MailMind AI. Generate a professional email reply based on this intent: "${intent}". Output ONLY the email body.`,
      },
      {
        role: "user",
        content: emailBody,
      },
    ]);

    const result = completion.choices[0].message.content.trim();

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

    res.json({ reply: result });
  } catch (error) {
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
    const openai = getOpenRouterClient();
    const completion = await getCompletion(
      openai,
      [
        {
          role: "system",
          content: "Summarize this email in 3 short bullet points.",
        },
        {
          role: "user",
          content: emailBody,
        },
      ],
      0.3,
    );

    const result = completion.choices[0].message.content.trim();

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

    res.json({ summary: result });
  } catch (error) {
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
    const openai = getOpenRouterClient();
    const completion = await getCompletion(
      openai,
      [
        {
          role: "system",
          content: `Extract meeting details from the email and return ONLY a valid JSON object. 
          Structure: {"title": "...", "description": "...", "location": "...", "startDate": "YYYYMMDDTHHMMSSZ", "endDate": "YYYYMMDDTHHMMSSZ"}.
          Do not include any other text or markdown formatting.`,
        },
        {
          role: "user",
          content: emailBody,
        },
      ],
      0,
    );

    let output = completion.choices[0].message.content.trim();
    output = output.replace(/```json\n?|\n?```/g, "");
    
    try {
      const parsed = JSON.parse(output);

      // Save to History if metadata is provided
      if (metadata && metadata.emailId) {
        await Summary.create({
          userEmail: userEmail,
          emailId: metadata.emailId,
          subject: metadata.subject,
          from: metadata.from,
          originalContent: emailBody,
          aiResult: output, // Store the raw JSON string
          type: 'schedule',
        });
      }

      res.json(parsed);
    } catch (parseErr) {
      console.error("Manual JSON Parse Error:", output, parseErr);
      res.status(500).json({ error: "AI returned invalid JSON format", details: output });
    }
  } catch (error) {
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
// Feature 5: Bulk Summarization
export const summarizeBulk = async (req, res) => {
  const { emailIds } = req.body;
  const userEmail = req.user.email;

  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: "At least one email ID is required" });
  }

  try {
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
        return `FROM: ${from}\nSUBJECT: ${subject}\nCONTENT: ${body}\n---`;
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

    const bulkSummary = completion.choices[0].message.content.trim();

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

    res.json({ summary: bulkSummary });
  } catch (error) {
    console.error("Bulk Summary Error:", error);
    res.status(500).json({ error: "Failed to generate bulk summary", details: error.message });
  }
};
