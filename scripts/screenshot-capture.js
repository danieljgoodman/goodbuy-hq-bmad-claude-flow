/**
 * Comprehensive Homescreen Screenshot Capture Tool
 * Captures screenshots across multiple device types, states, and accessibility modes
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  // Base URL for the homescreen (configurable)
  baseUrl: process.env.HOMESCREEN_URL || 'http://localhost:3000',
  
  // Output directory
  outputDir: path.join(__dirname, '../docs/ui-analysis'),
  
  // Browser options
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Viewport configurations
  viewports: {
    desktop: [
      { name: 'desktop-1920x1080', width: 1920, height: 1080 },
      { name: 'desktop-1366x768', width: 1366, height: 768 }
    ],
    tablet: [
      { name: 'tablet-768x1024', width: 768, height: 1024 },
      { name: 'tablet-1024x768', width: 1024, height: 768 }
    ],
    mobile: [
      { name: 'mobile-375x667', width: 375, height: 667 }, // iPhone 6/7/8
      { name: 'mobile-414x896', width: 414, height: 896 }, // iPhone 11
      { name: 'mobile-360x800', width: 360, height: 800 }  // Android
    ]
  },
  
  // UI states to capture
  states: ['default', 'loading', 'interactive', 'hover'],
  
  // Accessibility modes
  accessibilityModes: [
    { name: 'normal', settings: {} },
    { name: 'high-contrast', settings: { 'prefers-contrast': 'more' } },
    { name: 'reduced-motion', settings: { 'prefers-reduced-motion': 'reduce' } },
    { name: 'focus-visible', settings: { forcedColors: 'active' } }
  ],
  
  // Screenshot options
  screenshotOptions: {
    fullPage: true,
    quality: 90,
    type: 'png'
  }
};

class ScreenshotCapture {
  constructor() {
    this.browsers = new Map();
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Initialize browsers
   */
  async initializeBrowsers() {
    console.log('🚀 Initializing browsers...');
    
    for (const browserName of CONFIG.browsers) {
      try {
        const browserType = { chromium, firefox, webkit }[browserName];
        const browser = await browserType.launch({
          headless: true,
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        
        this.browsers.set(browserName, browser);
        console.log(`✅ ${browserName} initialized`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${browserName}:`, error.message);
      }
    }
  }

  /**
   * Create output directories
   */
  async createDirectories() {
    console.log('📁 Creating output directories...');
    
    const dirs = [
      CONFIG.outputDir,
      path.join(CONFIG.outputDir, 'screenshots'),
      path.join(CONFIG.outputDir, 'screenshots', this.timestamp)
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create subdirectories for each category
    const categories = ['desktop', 'tablet', 'mobile', 'accessibility', 'states'];
    for (const category of categories) {
      await fs.mkdir(path.join(CONFIG.outputDir, 'screenshots', this.timestamp, category), { recursive: true });
    }
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(page) {
    // Wait for network idle
    await page.waitForLoadState('networkidle');
    
    // Wait for main content to be visible
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForTimeout(1000); // Additional buffer
    } catch (error) {
      console.warn('⚠️ Timeout waiting for page readiness:', error.message);
    }
  }

  /**
   * Apply accessibility settings
   */
  async applyAccessibilitySettings(page, settings) {
    if (Object.keys(settings).length === 0) return;

    await page.emulateMedia({
      colorScheme: settings['prefers-color-scheme'] || null,
      reducedMotion: settings['prefers-reduced-motion'] || null,
      forcedColors: settings.forcedColors || null
    });

    // Apply CSS for high contrast
    if (settings['prefers-contrast'] === 'more') {
      await page.addStyleTag({
        content: `
          * {
            filter: contrast(150%) !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          a, button {
            border: 2px solid black !important;
          }
        `
      });
    }
  }

  /**
   * Simulate different UI states
   */
  async simulateUIState(page, state) {
    switch (state) {
      case 'loading':
        // Inject loading state simulation
        await page.evaluate(() => {
          const loadingDiv = document.createElement('div');
          loadingDiv.id = 'loading-overlay';
          loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-size: 18px;
          `;
          loadingDiv.innerHTML = '<div>Loading...</div>';
          document.body.appendChild(loadingDiv);
        });
        break;

      case 'interactive':
        // Focus on interactive elements
        await page.evaluate(() => {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        });
        break;

      case 'hover':
        // Simulate hover on primary navigation or buttons
        try {
          const hoverElements = await page.$$('nav a, button, .btn');
          if (hoverElements.length > 0) {
            await hoverElements[0].hover();
          }
        } catch (error) {
          console.warn('⚠️ Could not simulate hover:', error.message);
        }
        break;

      default:
        // Default state - no changes
        break;
    }

    // Wait for any animations to complete
    await page.waitForTimeout(500);
  }

  /**
   * Capture screenshot for specific configuration
   */
  async captureScreenshot(browserName, viewport, state, accessibilityMode) {
    const browser = this.browsers.get(browserName);
    if (!browser) return null;

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    try {
      // Apply accessibility settings
      await this.applyAccessibilitySettings(page, accessibilityMode.settings);

      // Navigate to the homescreen
      await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
      await this.waitForPageReady(page);

      // Simulate UI state
      await this.simulateUIState(page, state);

      // Generate filename
      const filename = `${viewport.name}-${browserName}-${state}-${accessibilityMode.name}.png`;
      const category = viewport.name.includes('desktop') ? 'desktop' : 
                     viewport.name.includes('tablet') ? 'tablet' : 'mobile';
      
      const outputPath = path.join(
        CONFIG.outputDir, 
        'screenshots', 
        this.timestamp, 
        category,
        filename
      );

      // Take screenshot
      await page.screenshot({
        path: outputPath,
        ...CONFIG.screenshotOptions
      });

      console.log(`📸 Captured: ${filename}`);
      
      return {
        filename,
        path: outputPath,
        viewport: viewport.name,
        browser: browserName,
        state,
        accessibility: accessibilityMode.name,
        category
      };

    } catch (error) {
      console.error(`❌ Failed to capture ${viewport.name}-${browserName}-${state}-${accessibilityMode.name}:`, error.message);
      return null;
    } finally {
      await context.close();
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(results) {
    const reportPath = path.join(CONFIG.outputDir, 'screenshots', this.timestamp, 'report.json');
    
    const report = {
      timestamp: this.timestamp,
      baseUrl: CONFIG.baseUrl,
      totalScreenshots: results.filter(r => r !== null).length,
      failedCaptures: results.filter(r => r === null).length,
      browsers: CONFIG.browsers,
      viewports: CONFIG.viewports,
      states: CONFIG.states,
      accessibilityModes: CONFIG.accessibilityModes.map(m => m.name),
      results: results.filter(r => r !== null),
      summary: {
        desktop: results.filter(r => r && r.category === 'desktop').length,
        tablet: results.filter(r => r && r.category === 'tablet').length,
        mobile: results.filter(r => r && r.category === 'mobile').length
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also generate a markdown report
    const mdReportPath = path.join(CONFIG.outputDir, 'screenshots', this.timestamp, 'README.md');
    const mdContent = this.generateMarkdownReport(report);
    await fs.writeFile(mdReportPath, mdContent);

    console.log(`📊 Report generated: ${reportPath}`);
    return report;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    return `# Screenshot Capture Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Base URL:** ${report.baseUrl}  
**Total Screenshots:** ${report.totalScreenshots}  
**Failed Captures:** ${report.failedCaptures}

## Summary by Category

- **Desktop:** ${report.summary.desktop} screenshots
- **Tablet:** ${report.summary.tablet} screenshots  
- **Mobile:** ${report.summary.mobile} screenshots

## Browsers Tested

${report.browsers.map(b => `- ${b}`).join('\n')}

## Viewports Captured

### Desktop
${Object.values(report.viewports.desktop || {}).map(v => `- ${v.name} (${v.width}x${v.height})`).join('\n')}

### Tablet  
${Object.values(report.viewports.tablet || {}).map(v => `- ${v.name} (${v.width}x${v.height})`).join('\n')}

### Mobile
${Object.values(report.viewports.mobile || {}).map(v => `- ${v.name} (${v.width}x${v.height})`).join('\n')}

## UI States Tested

${report.states.map(s => `- ${s}`).join('\n')}

## Accessibility Modes

${report.accessibilityModes.map(a => `- ${a}`).join('\n')}

## Screenshots by Category

${['desktop', 'tablet', 'mobile'].map(category => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}

${report.results
  .filter(r => r.category === category)
  .map(r => `- ![${r.filename}](./${category}/${r.filename})`)
  .join('\n')}
`).join('\n')}
`;
  }

  /**
   * Run complete screenshot capture process
   */
  async run() {
    console.log('🎬 Starting comprehensive screenshot capture...');
    console.log(`📍 Target URL: ${CONFIG.baseUrl}`);

    try {
      await this.initializeBrowsers();
      await this.createDirectories();

      const results = [];
      let totalCombinations = 0;
      
      // Calculate total combinations
      for (const category in CONFIG.viewports) {
        totalCombinations += CONFIG.viewports[category].length * 
                            this.browsers.size * 
                            CONFIG.states.length * 
                            CONFIG.accessibilityModes.length;
      }

      console.log(`🎯 Total combinations to capture: ${totalCombinations}`);

      let completed = 0;

      // Iterate through all combinations
      for (const category in CONFIG.viewports) {
        for (const viewport of CONFIG.viewports[category]) {
          for (const browserName of this.browsers.keys()) {
            for (const state of CONFIG.states) {
              for (const accessibilityMode of CONFIG.accessibilityModes) {
                const result = await this.captureScreenshot(
                  browserName,
                  viewport,
                  state,
                  accessibilityMode
                );
                
                results.push(result);
                completed++;
                
                const progress = Math.round((completed / totalCombinations) * 100);
                console.log(`📊 Progress: ${progress}% (${completed}/${totalCombinations})`);
              }
            }
          }
        }
      }

      // Generate comprehensive report
      const report = await this.generateReport(results);

      console.log('\n✅ Screenshot capture completed!');
      console.log(`📁 Output directory: ${path.join(CONFIG.outputDir, 'screenshots', this.timestamp)}`);
      console.log(`📊 Successfully captured: ${report.totalScreenshots} screenshots`);
      if (report.failedCaptures > 0) {
        console.log(`⚠️ Failed captures: ${report.failedCaptures}`);
      }

      return report;

    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
      throw error;
    } finally {
      // Close all browsers
      for (const browser of this.browsers.values()) {
        await browser.close();
      }
    }
  }

  /**
   * Close all browsers
   */
  async cleanup() {
    for (const browser of this.browsers.values()) {
      await browser.close();
    }
  }
}

// CLI interface
if (require.main === module) {
  const screenshotCapture = new ScreenshotCapture();
  
  screenshotCapture.run()
    .then((report) => {
      console.log('\n🎉 All done! Report summary:');
      console.log(JSON.stringify(report.summary, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = ScreenshotCapture;