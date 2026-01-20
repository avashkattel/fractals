
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173/fractals/playground';
const OUTPUT_DIR = path.join(__dirname, '../public/thumbnails');

// Fractal IDs to capture (Mirrors fractals.ts)
const FRACTALS = [
    'mandelbrot',
    'julia',
    'burning_ship',
    'newton',
    'tricorn',
    'celtic',
    'lambda',
    'sine',
    'cosine',
    'mandelbulb',
    'menger'
];

async function capture() {
    console.log('Starting Thumbnail Generation...');

    // Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 450 }); // 16:9 Aspect

    for (const id of FRACTALS) {
        const url = `${BASE_URL}?fractal=${id}`; // Params will default to initial view
        console.log(`Capturing ${id}...`);

        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            // Wait a bit for shader compilation/lazy load
            await new Promise(r => setTimeout(r, 2000));

            const outputPath = path.join(OUTPUT_DIR, `${id}.jpg`);
            await page.screenshot({ path: outputPath, type: 'jpeg', quality: 80 });
            console.log(`Saved: ${id}.jpg`);
        } catch (e) {
            console.error(`Failed to capture ${id}:`, e);
            // Optionally save a fallback/placeholder
        }
    }

    await browser.close();
    console.log('Thumbnail generation complete.');
}

capture();
