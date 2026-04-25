import OpenAI from 'openai';

// Initialize OpenAI client pointing to OpenRouter
// Make sure to add OPENROUTER_API_KEY to your .env file
const getOpenRouterClient = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment variables');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    // Optional: add default headers for OpenRouter rankings/stats
    // defaultHeaders: {
    //   'HTTP-Referer': 'http://localhost:8080', // Replace with your actual site URL
    //   'X-Title': 'MailMind AI', // Replace with your app name
    // },
  });
};

// Feature 1: Smart Reply Generation
export const generateReply = async (req, res) => {
  const { emailBody, intent = 'polite' } = req.body;

  if (!emailBody) {
    return res.status(400).json({ error: 'emailBody is required' });
  }

  try {
    const openai = getOpenRouterClient();
    
    // Using a reliable model like google/gemini-2.5-flash or anthropic/claude-3-haiku via OpenRouter
    // You can change this to any model OpenRouter supports (e.g., 'openai/gpt-4o-mini', 'meta-llama/llama-3-8b-instruct')
    const model = 'google/gemma-4-26b-a4b-it:free'; 

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are MailMind AI, an intelligent email assistant. 
          Generate a concise, professional, and ${intent} reply to the following email. 
          Only output the email body, no subject line, no pleasantries like "Here is your reply".`,
        },
        {
          role: 'user',
          content: emailBody,
        },
      ],
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content.trim() });
  } catch (error) {
    console.error('AI Reply Error:', error.message);
    res.status(500).json({ error: 'Failed to generate reply using OpenRouter' });
  }
};

// Feature 2: Email Summarization
export const summarizeEmail = async (req, res) => {
  const { emailBody } = req.body;

  if (!emailBody) {
    return res.status(400).json({ error: 'emailBody is required' });
  }

  try {
    const openai = getOpenRouterClient();
    const model = 'google/gemma-4-26b-a4b-it:free'; 

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are MailMind AI. Summarize the following email in 3 bullet points or less. Highlight any action items.',
        },
        {
          role: 'user',
          content: emailBody,
        },
      ],
      temperature: 0.3,
    });

    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (error) {
    console.error('AI Summary Error:', error.message);
    res.status(500).json({ error: 'Failed to summarize email using OpenRouter' });
  }
};
