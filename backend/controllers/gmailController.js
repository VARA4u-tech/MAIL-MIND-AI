import { google } from 'googleapis';
import { getClientForUser } from './authController.js';
import { getOpenRouterClient, getCompletion } from './aiController.js';
import { extractBody } from '../utils/gmailUtils.js';

// GET /api/gmail/inbox
export const getInbox = async (req, res) => {
  const email = req.user.email;

  const authClient = await getClientForUser(email);
  if (!authClient) return res.status(401).json({ error: 'User not authenticated. Please login first.' });

  try {
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Fetch list of latest 10 messages
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      labelIds: ['INBOX'],
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) return res.json({ emails: [] });

    // Fetch full details for each message in parallel
    const emailDetails = await Promise.all(
      messages.map(async ({ id }) => {
        const msgRes = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const headers = msgRes.data.payload?.headers || [];
        const get = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
        return {
          id,
          subject: get('Subject'),
          from: get('From'),
          date: get('Date'),
          snippet: msgRes.data.snippet,
          body: extractBody(msgRes.data.payload),
        };
      })
    );

    // AI Categorization Batch Call
    try {
      const openai = getOpenRouterClient();
      const emailSummaries = emailDetails.map(e => `ID: ${e.id} | Subject: ${e.subject} | Snippet: ${e.snippet}`).join('\n');
      
      const completion = await getCompletion(openai, [
        {
          role: "system",
          content: `Categorize these emails into exactly one of: "Action Required", "Meeting", "Social", "Promotions", "Updates". 
          Return ONLY a valid JSON object mapping ID to category. Example: {"msg_id": "Action Required"}`
        },
        {
          role: "user",
          content: emailSummaries
        }
      ], 0);

      let output = completion.choices[0].message.content.trim();
      output = output.replace(/```json\n?|\n?```/g, "");
      const categories = JSON.parse(output);

      // Attach categories to email details
      emailDetails.forEach(e => {
        e.category = categories[e.id] || "Updates";
      });
    } catch (aiErr) {
      console.error("AI Categorization failed, falling back to default:", aiErr.message);
      emailDetails.forEach(e => e.category = "Updates");
    }

    res.json({ emails: emailDetails });
  } catch (error) {
    console.error('Get inbox error:', error.message);
    res.status(500).json({ error: 'Failed to fetch inbox', details: error.message });
  }
};

// GET /api/gmail/search?q=query
export const searchEmailsAI = async (req, res) => {
  const { q } = req.query;
  const email = req.user.email;

  if (!q) return res.status(400).json({ error: 'Search query required' });

  const authClient = await getClientForUser(email);
  if (!authClient) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Fetch a larger batch of emails to search through (latest 30)
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 30,
      labelIds: ['INBOX'],
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) return res.json({ emails: [] });

    // Fetch snippets and details
    const emailDetails = await Promise.all(
      messages.map(async ({ id }) => {
        const msgRes = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
        const headers = msgRes.data.payload?.headers || [];
        const get = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
        return {
          id,
          subject: get('Subject'),
          from: get('From'),
          date: get('Date'),
          snippet: msgRes.data.snippet,
        };
      })
    );

    // AI Semantic Filtering
    const openai = getOpenRouterClient();
    const emailData = emailDetails.map(e => `ID: ${e.id} | From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet}`).join('\n');
    
    const completion = await getCompletion(openai, [
      {
        role: "system",
        content: `You are a semantic search engine. Filter the provided emails based on this user query: "${q}". 
        Return ONLY a JSON array of the IDs that match the context. If no emails match, return [].`
      },
      {
        role: "user",
        content: emailData
      }
    ], 0);

    let output = completion.choices[0].message.content.trim();
    output = output.replace(/```json\n?|\n?```/g, "");
    const matchingIds = JSON.parse(output);

    const filteredEmails = emailDetails.filter(e => matchingIds.includes(e.id));

    res.json({ emails: filteredEmails });
  } catch (error) {
    console.error('AI Search error:', error.message);
    res.status(500).json({ error: 'Failed to perform AI search', details: error.message });
  }
};

// POST /api/gmail/send
// Body: { to, subject, body }
export const sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;
  const email = req.user.email;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  const authClient = await getClientForUser(email);
  if (!authClient) return res.status(401).json({ error: 'User not authenticated. Please login first.' });

  try {
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Construct RFC 2822 raw email
    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Send email error:', error.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
