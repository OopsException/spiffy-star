const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use GET.' })
    };
  }

  try {
    const store = getStore('newsletter');
    const key = 'subscribers.json';
    const subscribers = await store.get(key, { type: 'json' }) || [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscribers })
    };
  } catch (err) {
    console.error('list-subscribers function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error while reading subscribers' })
    };
  }
};
