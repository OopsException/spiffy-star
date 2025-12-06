const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const rawEmail = (body.email || '').toString().trim();
  const email = rawEmail.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid email address' })
    };
  }

  const filePath = path.join(process.cwd(), 'src', 'data', 'subscribers.json');

  try {
    let subscribers = [];
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      subscribers = JSON.parse(raw);
      if (!Array.isArray(subscribers)) subscribers = [];
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // If file doesn't exist, start with empty array
      subscribers = [];
    }

    const exists = subscribers.some(s => String(s).toLowerCase() === email);
    if (exists) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email already subscribed' })
      };
    }

    subscribers.push(email);

    // Write file back. Netlify functions have a writable /tmp during runtime,
    // but writing to the repo path can work during local/testing or build-time.
    // This uses the repo path as requested.
    await fs.writeFile(filePath, JSON.stringify(subscribers, null, 2), 'utf8');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('subscribe function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error while saving subscriber' })
    };
  }
};
