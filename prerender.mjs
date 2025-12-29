import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all routes to prerender
const ROUTES = [
  { path: '/', file: 'index.html' },
  { path: '/features', file: 'features.html' },
  { path: '/architecture', file: 'architecture.html' },
  { path: '/installation', file: 'installation.html' },
  { path: '/usage', file: 'usage.html' },
  { path: '/development', file: 'development.html' },
  { path: '/api', file: 'api.html' },
  { path: '/security', file: 'security.html' },
  { path: '/deployment', file: 'deployment.html' },
  { path: '/contributing', file: 'contributing.html' },
];

async function prerender() {
  console.log('[Prerender] Starting prerendering...');
  console.log(`[Prerender] Total routes to render: ${ROUTES.length}`);
  
  // Start a local server
  const app = express();
  const BASE_PATH = '/chatpulse';
  const DOCS_DIR = path.join(__dirname, 'docs');
  
  // Serve static files
  app.use(BASE_PATH, express.static(DOCS_DIR));
  
  // SPA fallback - serve index.html for all routes
  app.get(`${BASE_PATH}/*`, (req, res) => {
    res.sendFile(path.join(DOCS_DIR, 'index.html'));
  });
  
  const PORT = 45678;
  const server = app.listen(PORT, () => {
    console.log(`[Prerender] Server running on port ${PORT}`);
  });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const route of ROUTES) {
      try {
        const page = await browser.newPage();
        
        // Enable console logging from the page
        page.on('console', msg => {
          if (msg.text().includes('error') || msg.text().includes('Error')) {
            console.log('[Page Console]', msg.text());
          }
        });
        page.on('pageerror', error => console.log('[Page Error]', error.message));
        
        // Navigate to the page
        const url = `http://localhost:${PORT}${BASE_PATH}${route.path}`;
        console.log(`\n[Prerender] Rendering: ${route.path} -> ${route.file}`);
        
        const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        if (response.status() !== 200) {
          throw new Error(`HTTP ${response.status()}`);
        }
        
        // Wait for React to render
        await page.waitForSelector('#root > *', { timeout: 10000 });
        
        // Give it time for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the rendered HTML
        const renderedHtml = await page.content();
        
        // Write to file
        const htmlPath = path.join(__dirname, 'docs', route.file);
        fs.writeFileSync(htmlPath, renderedHtml, 'utf-8');
        
        const fileSizeKB = (fs.statSync(htmlPath).size / 1024).toFixed(2);
        console.log(`[Prerender] ✓ Success: ${route.file} (${fileSizeKB} KB)`);
        
        await page.close();
        successCount++;
      } catch (error) {
        console.error(`[Prerender] ✗ Error rendering ${route.path}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n[Prerender] ===== Summary =====');
    console.log(`[Prerender] Total: ${ROUTES.length} routes`);
    console.log(`[Prerender] Success: ${successCount} routes`);
    console.log(`[Prerender] Errors: ${errorCount} routes`);
    console.log('[Prerender] Output directory:', DOCS_DIR);
    
    if (errorCount > 0) {
      console.warn('[Prerender] Warning: Some routes failed to render');
      process.exit(1);
    }
  } catch (error) {
    console.error('[Prerender] Fatal error during prerendering:', error);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
    console.log('[Prerender] Server closed');
  }
}

prerender().catch(error => {
  console.error('[Prerender] Fatal error:', error);
  process.exit(1);
});