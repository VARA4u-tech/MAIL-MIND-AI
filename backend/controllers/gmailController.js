import { google } from 'googleapis';
import { getClientForUser } from './authController.js';

// Decode base64url encoded email body parts
const decodeBase64 = (data) => {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

// Extract plain text body from a Gmail message payload
const extractBody = (payload) => {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    // Fallback to HTML
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
  }
  return '';
};

// GET /api/gmail/inbox?email=user@gmail.com
export const getInbox = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query param required' });

  const authClient = getClientForUser(email);
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

    res.json({ emails: emailDetails });
  } catch (error) {
    console.error('Get inbox error:', error.message);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
};

// POST /api/gmail/send
// Body: { email, to, subject, body }
export const sendEmail = async (req, res) => {
  const { email, to, subject, body } = req.body;
  if (!email || !to || !subject || !body) {
    return res.status(400).json({ error: 'email, to, subject, and body are required' });
  }

  const authClient = getClientForUser(email);
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
