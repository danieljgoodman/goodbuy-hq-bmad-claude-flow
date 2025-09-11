const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HOMESCREEN_URL = process.env.HOMESCREEN_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'ui-analysis', 'screenshots');

// Device configurations for basic analysis
const devices = [
  { name: 'desktop', width: 1920, height: 1080, isMobile: false },
  { name: 'tablet', width: 768, height: 1024, isMobile: false },
  { name: 'mobile', width: 375, height: 667, isMobile: true }
];

async function captureScreenshots() {
  console.log('🎬 Starting basic screenshot capture...');
  console.log(`📍 Target URL: ${HOMESCREEN_URL}`);
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const device of devices) {
      console.log(`📱 Capturing ${device.name} (${device.width}x${device.height})`);
      
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.isMobile ? 2 : 1,
        isMobile: device.isMobile,
        hasTouch: device.isMobile
      });

      const page = await context.newPage();
      
      try {
        await page.goto(HOMESCREEN_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000); // Wait for any animations
        
        const filename = `homescreen-${device.name}-${device.width}x${device.height}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        await page.screenshot({
          path: filepath,
          fullPage: true,
          type: 'png'
        });
        
        console.log(`✅ Captured: ${filename}`);
      } catch (error) {
        console.error(`❌ Failed to capture ${device.name}:`, error.message);
      }
      
      await context.close();
    }
  } finally {
    await browser.close();
  }
  
  console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`);
  console.log('✅ Basic screenshot capture complete!');
}

captureScreenshots().catch(console.error);