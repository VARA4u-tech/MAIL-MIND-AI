import { google } from 'googleapis';
import { getClientForUser } from './authController.js';

// POST /api/calendar/create-event
// Body: { title, description, location, startDate, endDate }
export const createEvent = async (req, res) => {
  const { title, description, location, startDate, endDate } = req.body;
  const email = req.user.email;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'title, startDate, and endDate are required' });
  }

  const authClient = await getClientForUser(email);
  if (!authClient) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const event = {
      summary: title,
      location: location,
      description: description,
      start: {
        dateTime: formatToISO(startDate),
        timeZone: 'UTC',
      },
      end: {
        dateTime: formatToISO(endDate),
        timeZone: 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json({ success: true, event: response.data });
  } catch (error) {
    console.error('Create calendar event error:', error.message);
    res.status(500).json({ error: 'Failed to create calendar event', details: error.message });
  }
};

// Helper to handle both YYYYMMDDTHHMMSSZ and standard ISO strings
const formatToISO = (dateStr) => {
  if (dateStr.includes('-')) return dateStr; // Already ISO-ish
  
  // Convert YYYYMMDDTHHMMSSZ to YYYY-MM-DDTHH:MM:SSZ
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  const hour = dateStr.slice(9, 11);
  const minute = dateStr.slice(11, 13);
  const second = dateStr.slice(13, 15);
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
};
