import { getAuthUrl, getTokensFromCode, createAuthenticatedClient } from '../config/googleAuth.js';
import { google } from 'googleapis';
import User from '../models/User.js';

// Step 1: Redirect user to Google consent screen
export const startAuth = (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
};

// Step 2: Handle the callback from Google after user consents
export const handleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    const authClient = createAuthenticatedClient(tokens);

    // Get user info to identify them
    const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Store tokens in MongoDB mapped to user's email
    await User.findOneAndUpdate(
      { email: userInfo.email },
      {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        tokens: tokens,
      },
      { upsert: true, new: true }
    );

    // Redirect back to frontend with email in query string
    res.redirect(`http://localhost:8080/dashboard?email=${encodeURIComponent(userInfo.email)}`);
  } catch (error) {
    console.error('Auth callback error:', error.message);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
};

// Helper: get authenticated client for a user
export const getClientForUser = async (email) => {
  const user = await User.findOne({ email });
  if (!user || !user.tokens) return null;
  return createAuthenticatedClient(user.tokens);
};
