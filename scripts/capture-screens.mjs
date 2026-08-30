import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function main() {
  const outDir = path.resolve(import.meta.dirname, '../src/assets/screens');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x for sharp rendering, will scale or compress cleanly
  });
  const page = await context.newPage();

  console.log('Loading app on http://localhost:1420 ...');
  await page.goto('http://localhost:1420');
  await page.waitForTimeout(500);

  // Switch to dark theme
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });

  // Open Sample Study
  const openButtons = await page.$$('button:has-text("Open")');
  if (openButtons.length > 0) {
    await openButtons[0].click();
    await page.waitForTimeout(1000);
  }

  // Ensure theme remains dark in workspace
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(500);

  // 1. Capture Transcript with coding bubble / coded span
  console.log('Preparing Shot 1: Transcript with coding bubble...');
  // Find a transcript paragraph or segment and select a phrase
  // Let's find a paragraph with text inside the transcript view
  const paragraphs = await page.$$('div[data-testid="transcript-segment"], p');
  console.log('Found paragraphs count:', paragraphs.length);

  // Let's trigger a text selection or coding bubble
  // We can select text in a paragraph and press 'c' or trigger mouseup
  const transcriptParagraph = await page.$('main p, div.prose p, [data-segment-id] p, p');
  if (transcriptParagraph) {
    const box = await transcriptParagraph.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 220, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  }

  // If bubble needs 'c' key or right-click or appears automatically
  await page.keyboard.press('c');
  await page.waitForTimeout(600);

  const png1 = await page.screenshot({ type: 'png' });
  const shot1Path = path.join(outDir, 'transcript-coding.webp');
  await sharp(png1)
    .resize(1440, 900)
    .webp({ quality: 85 })
    .toFile(shot1Path);
  const size1 = fs.statSync(shot1Path).size;
  console.log('Saved Shot 1 (transcript-coding.webp):', size1, 'bytes');

  // 2. Capture Codebook panel
  console.log('Preparing Shot 2: Codebook panel...');
  // Click outside to dismiss bubble
  await page.mouse.click(100, 100);
  await page.waitForTimeout(300);

  const png2 = await page.screenshot({ type: 'png' });
  const shot2Path = path.join(outDir, 'codebook-panel.webp');
  await sharp(png2)
    .resize(1440, 900)
    .webp({ quality: 85 })
    .toFile(shot2Path);
  const size2 = fs.statSync(shot2Path).size;
  console.log('Saved Shot 2 (codebook-panel.webp):', size2, 'bytes');

  // 3. Capture Export Dialog or Notes / Memos
  console.log('Preparing Shot 3: Export Dialog...');
  const exportBtn = await page.$('button:has-text("Export…"), button:has-text("Export")');
  if (exportBtn) {
    await exportBtn.click();
    await page.waitForTimeout(800);
  }

  const png3 = await page.screenshot({ type: 'png' });
  const shot3Path = path.join(outDir, 'export-dialog.webp');
  await sharp(png3)
    .resize(1440, 900)
    .webp({ quality: 85 })
    .toFile(shot3Path);
  const size3 = fs.statSync(shot3Path).size;
  console.log('Saved Shot 3 (export-dialog.webp):', size3, 'bytes');

  await browser.close();
  console.log('Screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
