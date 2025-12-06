const path = require('path');
const { pathToFileURL } = require('url');

async function loadHandler() {
  const modulePath = path.resolve(__dirname, '../netlify/functions/subscribe.js');
  const mod = await import(pathToFileURL(modulePath).href);
  return mod.handler;
}

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
  const handler = await loadHandler();
  const email = process.argv[2] || 'localtest@example.com';
  const event = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  };
  const res = await handler(event);
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
})();