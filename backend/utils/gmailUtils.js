// Decode base64url encoded email body parts
export const decodeBase64 = (data) => {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

// Extract plain text body from a Gmail message payload
export const extractBody = (payload) => {
  if (!payload) return '';

  // If the body is directly in the payload
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // If the message has parts (multipart)
  if (payload.parts) {
    let plainText = '';
    let htmlText = '';

    const processParts = (parts) => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          plainText = decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlText = decodeBase64(part.body.data);
        } else if (part.parts) {
          processParts(part.parts);
        }
      }
    };

    processParts(payload.parts);

    // Return HTML if available, otherwise plain text
    return htmlText || plainText || '';
  }

  return '';
};
