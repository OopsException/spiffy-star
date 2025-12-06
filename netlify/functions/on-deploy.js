import { fetch } from "undici";
const SIGNING_SECRET = process.env.SIGNING_SECRET || "";

export default async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  let payload = {};
  try { payload = await req.json(); } catch {}
  const url = new URL(req.url);
  if (SIGNING_SECRET && url.searchParams.get("secret") !== SIGNING_SECRET) return new Response("Unauthorized", { status: 401 });

  const base = payload.deploy_ssl_url || process.env.URL;
  const r = await fetch(`${base}/feed.json`, { headers: { "Cache-Control": "no-cache" }});
  if (!r.ok) return new Response(`feed.json error ${r.status}`, { status: 502 });
  const { items = [] } = await r.json();
  const latest = items[0];
  if (!latest) return new Response("No items", { status: 200 });

  const ageMs = Date.now() - new Date(latest.pubDate).getTime();
  if (isNaN(ageMs) || ageMs > 2 * 60 * 60 * 1000) return new Response("Not fresh; skipped", { status: 200 });

  // Choose template
  let template = "title-summary";
  let bodyPayload = {};
  if ((latest.firstParagraph || "").length >= 200) {
    template = "title-paragraph";
    bodyPayload.paragraph = latest.firstParagraph.slice(0, 270) + (latest.firstParagraph.length > 270 ? "…" : "");
  } else if ((latest.summary || "").length >= 120) {
    template = "title-summary";
    bodyPayload.summary = latest.summary.slice(0, 260) + (latest.summary.length > 260 ? "…" : "");
  } else {
    template = "title-quote";
    const q = (latest.summary || latest.title || "").trim();
    bodyPayload.quote = q.slice(0, 180) + (q.length > 180 ? "…" : "");
  }

  const caption = `${latest.title}\n${new URL(latest.url, base).href}\n#astro #webdev`;

  const postRes = await fetch(`${base}/.netlify/functions/post-to-ig`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template,
      title: latest.title,
      caption,
      handle: undefined,
      ...bodyPayload,
      secret: SIGNING_SECRET,
    }),
  });
  const data = await postRes.json().catch(() => ({}));
  const ok = postRes.ok && data?.ok;
  return new Response(JSON.stringify(ok ? { ok: true } : { ok: false, data }), { status: ok ? 200 : 500, headers: { "Content-Type": "application/json" } });
};
