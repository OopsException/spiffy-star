import { fetch } from "undici";

const IG_USER_ID = process.env.IG_USER_ID;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const SIGNING_SECRET = process.env.SIGNING_SECRET || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req) => {
  // Quick feature gate: disable IG autoposting by setting DISABLE_IG_AUTOPOST=1 or true
  if (process.env.DISABLE_IG_AUTOPOST === '1' || process.env.DISABLE_IG_AUTOPOST === 'true') {
    return new Response(JSON.stringify({ ok: false, disabled: true, reason: 'IG autopost disabled via DISABLE_IG_AUTOPOST' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "Content-Type": "application/json", ...cors } });

  let body = {};
  try {
    body = await req.json();
  } catch {}
  const { template = "title-summary", title, quote = "", summary = "", paragraph = "", caption = "", handle = "", secret = "" } = body;
  if (SIGNING_SECRET && secret !== SIGNING_SECRET)
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });
  if (!title)
    return new Response(JSON.stringify({ error: "Missing 'title'" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });

  const base = process.env.DEPLOY_PRIME_URL || req.headers.get("origin") || process.env.URL || "";
  const params = new URLSearchParams({ t: template, title, quote, summary, paragraph, handle });
  const imageUrl = `${base}/.netlify/functions/og-image?${params.toString()}`;

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`,
    { method: "POST" }
  );
  const createData = await createRes.json();
  if (!createRes.ok)
    return new Response(JSON.stringify({ error: "Create media failed", details: createData }), { status: 500, headers: { "Content-Type": "application/json", ...cors } });

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish?creation_id=${encodeURIComponent(createData.id)}&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`,
    { method: "POST" }
  );
  const publishData = await publishRes.json();
  if (!publishRes.ok)
    return new Response(JSON.stringify({ error: "Publish failed", details: publishData }), { status: 500, headers: { "Content-Type": "application/json", ...cors } });

  return new Response(JSON.stringify({ ok: true, publish: publishData }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });
};
