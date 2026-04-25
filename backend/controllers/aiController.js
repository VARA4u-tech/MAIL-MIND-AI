import OpenAI from 'openai';

// Initialize OpenAI client pointing to OpenRouter
const getOpenRouterClient = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is missing');

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
       'HTTP-Referer': 'http://localhost:8080', 
       'X-Title': 'MailMind AI', 
    },
  });
};

// Updated model list based on your request (using Gemma 2 27B as the large version)
const MODELS = [
  'google/gemma-2-27b-it', // Most likely the one you meant by 26B/A4B
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free'
];

// Robust completion handler
const getCompletion = async (openai, messages, temperature = 0.7, json = false) => {
  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`AI Strategy: Attempting with ${model}...`);
      const response = await openai.chat.completions.create({
        model: model,
        messages,
        temperature,
        ...(json ? { response_format: { type: "json_object" } } : {}),
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
  const { emailBody, intent = 'polite' } = req.body;
  if (!emailBody) return res.status(400).json({ error: 'emailBody is required' });

  try {
    const openai = getOpenRouterClient();
    const completion = await getCompletion(openai, [
      {
        role: 'system',
        content: `You are MailMind AI. Generate a professional email reply based on this intent: "${intent}". Output ONLY the email body.`,
      },
      {
        role: 'user',
        content: emailBody,
      },
    ]);

    res.json({ reply: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ error: 'AI Generation Failed', details: error.message });
  }
};

// Feature 2: Email Summarization
export const summarizeEmail = async (req, res) => {
  const { emailBody } = req.body;
  if (!emailBody) return res.status(400).json({ error: 'emailBody is required' });

  try {
    const openai = getOpenRouterClient();
    const completion = await getCompletion(openai, [
      {
        role: 'system',
        content: 'Summarize this email in 3 short bullet points.',
      },
      {
        role: 'user',
        content: emailBody,
      },
    ], 0.3);

    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize', details: error.message });
  }
};

// Feature 3: Schedule Extraction
export const scheduleEvent = async (req, res) => {
  const { emailBody } = req.body;
  if (!emailBody) return res.status(400).json({ error: 'emailBody is required' });

  try {
    const openai = getOpenRouterClient();
    const completion = await getCompletion(openai, [
      {
        role: 'system',
        content: `Extract meeting details as JSON.`,
      },
      {
        role: 'user',
        content: emailBody,
      },
    ], 0, true);

    res.json(JSON.parse(completion.choices[0].message.content.trim()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract schedule', details: error.message });
  }
};
