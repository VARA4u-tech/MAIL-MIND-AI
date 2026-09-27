import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

const authController = await import('../controllers/authController.js');
const googleAuth = await import('../config/googleAuth.js');
const User = (await import('../models/User.js')).default;
const { google } = await import('googleapis');

const stubGoogleUserInfo = { email: 'user@example.com', name: 'Test User', picture: 'https://example.com/pic.png' };
const mockToken = { access_token: 'abc', refresh_token: 'def', expiry_date: 123 };

test('handleCallback sets a secure cookie and omits token from redirect URL', async () => {
  const getTokensMock = mock.method(googleAuth, 'getTokensFromCode', async () => mockToken);
  const createClientMock = mock.method(googleAuth, 'createAuthenticatedClient', () => ({ setCredentials() {} }));
  const userFindMock = mock.method(User, 'findOneAndUpdate', async () => ({ _id: 'user-123', email: stubGoogleUserInfo.email }));
  const oauth2Mock = mock.method(google, 'oauth2', () => ({
    userinfo: {
      get: async () => ({ data: stubGoogleUserInfo }),
    },
  }));

  const cookieValues = {};
  const res = {
    cookie(name, value, options) {
      cookieValues[name] = { value, options };
    },
    redirect(url) {
      this.redirectUrl = url;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    clearCookie() {},
  };

  const req = { query: { code: 'abc123' } };

  await authController.handleCallback(req, res);

  assert.equal(res.redirectUrl.includes('token='), false);
  assert.equal(cookieValues.jwt.value.length > 0, true);
  assert.equal(cookieValues.jwt.options.httpOnly, true);
  assert.equal(cookieValues.jwt.options.sameSite, 'lax');

  getTokensMock.mock.restore();
  createClientMock.mock.restore();
  userFindMock.mock.restore();
  oauth2Mock.mock.restore();
});
