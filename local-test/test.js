import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Polyfill replaceAll for older Node versions
if (!String.prototype.replaceAll) {
  // @ts-ignore
  String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
  };
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function toDataUri(filePath) {
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let mime = 'application/octet-stream';
  if (ext === '.svg') mime = 'image/svg+xml';
  else if (ext === '.png') mime = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  else if (ext === '.webp') mime = 'image/webp';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function inlineImageFromCandidate(value, candidates = []) {
  // If value is already a data URI, return as-is
  if (typeof value === 'string' && value.startsWith('data:')) return value;

  // Try the literal path first (relative to cwd)
  const tryPaths = [];
  if (typeof value === 'string') {
    tryPaths.push(path.resolve(process.cwd(), value));
  }
  // Add provided candidates
  for (const c of candidates) tryPaths.push(path.resolve(process.cwd(), c));

  for (const p of tryPaths) {
    if (await fileExists(p)) {
      return await toDataUri(p);
    }
  }
  return null;
}

async function run() {
  try {
    // Choose template
    const templatePath = path.join(process.cwd(), 'src', 'assets', 'ig', 'templates', 'title-quote.svg');

    // Read template
    let svg = await fs.readFile(templatePath, 'utf8');

    // Ensure SVG root has width/height/viewBox
    const svgOpenMatch = svg.match(/<svg([^>]*)>/i);
    if (svgOpenMatch) {
      const attrs = svgOpenMatch[1];
      const needs = [];
      if (!/\bwidth\s*=\s*"\d+/i.test(attrs)) needs.push('width="1080"');
      if (!/\bheight\s*=\s*"\d+/i.test(attrs)) needs.push('height="1080"');
      if (!/\bviewBox\s*=\s*"[^"]+"/i.test(attrs)) needs.push('viewBox="0 0 1080 1080"');
      if (needs.length) {
        const replacement = `<svg ${attrs} ${needs.join(' ')}>`;
        svg = svg.replace(svgOpenMatch[0], replacement);
      }
    } else {
      // If missing entire <svg> tag, wrap the content
      svg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
    }

    // Mock data
    const PADDING = 96;
    const SIZE = 1080;
    const LOGO_WIDTH = 84;
    const CONTENT_W = SIZE - PADDING * 2;
    const computed = {
      PADDING,
      CONTENT_W,
      PADDING_PLUS_16: PADDING + 16,
      PADDING_PLUS_36: PADDING + 36,
      PADDING_PLUS_40: PADDING + 40,
      PADDING_PLUS_88: PADDING + 88,
      RIGHT_X: SIZE - PADDING,
      BOTTOM_Y: SIZE - Math.round(PADDING / 2),
      RIGHT_X_LOGO: SIZE - PADDING - LOGO_WIDTH,
      BOTTOM_Y_LOGO: SIZE - PADDING - LOGO_WIDTH,
      LOGO_WIDTH,
    };

    const mock = {
      TITLE: 'How to Stop Overthinking',
      QUOTE: 'Most overthinking is just fear dressed as logic.',
      HANDLE: '@raedwrites',
      SUMMARY: 'Overthinking happens when clarity is missing...',
      PARAGRAPH: 'In life, we often confuse thinking with worrying...',
      // These are example candidate paths; the script will try each until one exists
      LOGO_PATH: './src/assets/ig/logo/logo-b.svg',
      NOISE_TEXTURE_PATH: './src/assets/ig/noise.svg',
      // Use a safe font-family string without internal quotes to avoid breaking attributes
      FONT_FAMILY: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      // theme tokens
      BG_COLOR: '#f3f3f5',
      ACCENT: '#e4cdd5',
      MUTED: '#6e6e6e',
      FG: '#1f1f1f',
      TITLE_SIZE: 64,
      SUMMARY_SIZE: 44,
      PARAGRAPH_SIZE: 42,
      QUOTE_SIZE: 56,
      WATERMARK_SIZE: 28,
      ...computed,
    };

    // Inline images (logo + noise) as data URIs so sharp can rasterize SVG without external refs
    const logoData = await inlineImageFromCandidate(mock.LOGO_PATH, [
      './src/assets/ig/logo/logo-b.svg',
      './src/assets/ig/logo/logo-b.png',
      './src/assets/ig/logo/logo-b.webp',
    ]);
    const noiseData = await inlineImageFromCandidate(mock.NOISE_TEXTURE_PATH, [
      './src/assets/ig/noise.svg',
      './src/assets/ig/noise.png',
    ]);

    if (logoData) mock.LOGO_PATH = logoData;
    if (noiseData) mock.NOISE_TEXTURE_PATH = noiseData;

    // Escape replacements for XML contexts
    const escapeForXml = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Replace placeholders (escaped)
    for (const [key, rawValue] of Object.entries(mock)) {
      const value = escapeForXml(rawValue);
      const placeholder = `{{${key}}}`;
      svg = svg.replaceAll(placeholder, value);
    }

    // Diagnostic: find leftover placeholders
    const leftover = svg.match(/{{\s*[A-Z0-9_]+\s*}}/gi) || [];
    if (leftover.length) {
      console.warn('Warning: Unreplaced placeholders found:', [...new Set(leftover)].join(', '));
      // Remove any leftover placeholders to avoid SVG parse errors
      svg = svg.replace(/{{\s*[A-Z0-9_]+\s*}}/gi, '');
    }

    // Final validation: ensure there's at least some visible content (not strictly foolproof)
    if (!/\b(width|height|viewBox)\b/i.test(svg)) {
      throw new Error('SVG missing width/height/viewBox after sanitization');
    }

    // Ensure output directory exists
    const outDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outDir, { recursive: true });

    const outPath = path.join(outDir, 'test-image.png');

    // Render SVG to PNG using sharp
    await sharp(Buffer.from(svg)).png().toFile(outPath);

    console.log('✅ Test image rendered → output/test-image.png');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  }
}

run();
