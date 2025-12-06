const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  // Basic CORS support for browser POSTs
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  // Accept JSON and form-encoded submissions
  let body = {};
  const contentType = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  try {
    if (event.body) {
      if (contentType.includes('application/json')) {
        body = JSON.parse(event.body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        body = Object.fromEntries(new URLSearchParams(event.body));
      }
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const rawEmail = (body.email || '').toString().trim();
  const email = rawEmail.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid email address' })
    };
  }

  try {
    const store = getStore('newsletter', {
      siteID: process.env.NETLIFY_SITE_ID || process.env.NETLIFY_BLOBS_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN
    });
    const key = 'subscribers.json';

    let subscribers = await store.get(key, { type: 'json' });
    if (!Array.isArray(subscribers)) subscribers = [];

    const exists = subscribers.some((s) => String(s).toLowerCase() === email);
    if (exists) {
      return {
        statusCode: 409,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email already subscribed' })
      };
    }

    subscribers.push(email);
    await store.set(key, JSON.stringify(subscribers));

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('subscribe function error:', err);
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error while saving subscriber' })
    };
  }
};
