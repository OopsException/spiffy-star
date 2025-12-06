import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function run() {
  try {
    // Choose template (adjust path if you want a different one)
    const templatePath = path.join(process.cwd(), 'src', 'assets', 'ig', 'templates', 'title-summary.svg');

    // Read template
    let svg = await fs.readFile(templatePath, 'utf8');

    // Mock data
    const PADDING = 96;
    const mock = {
      TITLE: 'How to Stop Overthinking',
      QUOTE: 'Most overthinking is just fear dressed as logic.',
      HANDLE: '@raedwrites',
      SUMMARY: 'Overthinking happens when clarity is missing...',
      PARAGRAPH: 'In life, we often confuse thinking with worrying...',
      LOGO_PATH: './assets/logo.svg',
      NOISE_TEXTURE_PATH: './assets/noise.png',
      FONT_FAMILY: 'Inter',
      PADDING: String(PADDING),
      CONTENT_W: String(1080 - PADDING * 2)
    };

    // Replace placeholders using replaceAll
    for (const [key, value] of Object.entries(mock)) {
      const placeholder = `{{${key}}}`;
      // String.replaceAll exists in modern Node; use it as requested
      svg = svg.replaceAll(placeholder, value);
    }

    // Ensure output directory exists (root /output)
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
