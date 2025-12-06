import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const SIZE = 1080;
const ROOT = process.cwd();
const BRAND_PATH = path.join(ROOT, "assets/ig/brand.json");
const TPL_DIR = path.join(ROOT, "assets/ig/templates");

const escapeHtml = (s = "") => s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

export default async (req) => {
  try {
    const url = new URL(req.url);
    const t = url.searchParams.get("t") || "title-summary";
    const title = url.searchParams.get("title") || "Untitled";
    const handleParam = url.searchParams.get("handle") || "";
    const quote = url.searchParams.get("quote") || "";
    const summary = url.searchParams.get("summary") || "";
    const paragraph = url.searchParams.get("paragraph") || "";
    const logoOverride = url.searchParams.get("logo") || "";

    const brand = JSON.parse(await fs.readFile(BRAND_PATH, "utf8"));

    const PADDING = brand.layout?.padding ?? 96;
    const CONTENT_W = SIZE - PADDING * 2;
    const RIGHT_X = SIZE - PADDING;
    const BOTTOM_Y = SIZE - Math.round(PADDING / 2);
    const LOGO_WIDTH = brand.layout?.logoWidth ?? 84;
    const RIGHT_X_LOGO = SIZE - PADDING - LOGO_WIDTH;
    const BOTTOM_Y_LOGO = SIZE - PADDING - LOGO_WIDTH;

    // Prefer project's primary sans if available (fallback provided)
    const FONT_FAMILY = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
    const FG = brand.colors?.fg ?? "#f8fafc";
    const MUTED = brand.colors?.muted ?? "#a3a3a3";
    const ACCENT = brand.colors?.accent ?? "#22d3ee";

    let BG_COLOR = brand.colors?.bg ?? "#0f172a";
    let BG_GRADIENT = "";
    if (brand.useGradient && brand.background?.from && brand.background?.to) {
      BG_GRADIENT = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${brand.background.from}"/><stop offset="100%" stop-color="${brand.background.to}"/></linearGradient>`;
      BG_COLOR = "url(#g)";
    }

    const TITLE_SIZE = brand.typography?.titleSize ?? 64;
    const QUOTE_SIZE = brand.typography?.quoteSize ?? 56;
    const SUMMARY_SIZE = brand.typography?.summarySize ?? 44;
    const PARAGRAPH_SIZE = brand.typography?.paragraphSize ?? 42;
    const WATERMARK_SIZE = brand.typography?.watermarkSize ?? 28;

    const templatePath = path.join(TPL_DIR, `${t}.svg`);
    let svg = await fs.readFile(templatePath, "utf8");

    const replacements = {
      "{{TITLE}}": escapeHtml(title),
      "{{QUOTE}}": escapeHtml(quote),
      "{{SUMMARY}}": escapeHtml(summary),
      "{{PARAGRAPH}}": escapeHtml(paragraph),
      "{{HANDLE}}": escapeHtml(handleParam || brand.handle || "@handle"),
      "{{LOGO_PATH}}": escapeHtml(logoOverride || brand.logoPath || "/assets/ig/logo/logo-b.png"),
      "{{FONT_FAMILY}}": FONT_FAMILY,
      "{{FG}}": FG,
      "{{MUTED}}": MUTED,
      "{{ACCENT}}": ACCENT,
      "{{PADDING}}": String(PADDING),
      "{{PADDING_PLUS_16}}": String(PADDING + 16),
      "{{PADDING_PLUS_40}}": String(PADDING + 40),
      "{{PADDING_PLUS_88}}": String(PADDING + 88),
      "{{CONTENT_W}}": String(CONTENT_W),
      "{{RIGHT_X}}": String(RIGHT_X),
      "{{BOTTOM_Y}}": String(BOTTOM_Y),
      "{{RIGHT_X_LOGO}}": String(RIGHT_X_LOGO),
      "{{BOTTOM_Y_LOGO}}": String(BOTTOM_Y_LOGO),
      "{{LOGO_WIDTH}}": String(LOGO_WIDTH),
      "{{BG_GRADIENT}}": BG_GRADIENT,
      "{{BG_COLOR}}": BG_COLOR,
      "{{TITLE_SIZE}}": String(TITLE_SIZE),
      "{{QUOTE_SIZE}}": String(QUOTE_SIZE),
      "{{SUMMARY_SIZE}}": String(SUMMARY_SIZE),
      "{{PARAGRAPH_SIZE}}": String(PARAGRAPH_SIZE),
      "{{WATERMARK_SIZE}}": String(WATERMARK_SIZE),
    };

    for (const [k, v] of Object.entries(replacements)) {
      svg = svg.split(k).join(v);
    }

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(png, { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (err) {
    const msg = { error: "failed", message: String(err?.message || err) };
    return new Response(JSON.stringify(msg), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
