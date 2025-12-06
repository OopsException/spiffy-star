const path = require('path');
const { handler } = require('../netlify/functions/subscribe.js');

async function run(email) {
  const event = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  };
  const res = await handler(event);
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
}

(async () => {
  const email = process.argv[2] || 'localtest@example.com';
  await run(email);
})();
