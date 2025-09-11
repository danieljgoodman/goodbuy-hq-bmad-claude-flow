# Screenshot Capture Scripts

This directory contains comprehensive tools for capturing homescreen screenshots across multiple devices, browsers, and accessibility modes.

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Capture screenshots from local development server
cd scripts
npm run capture:dev

# Capture screenshots from production
npm run capture:prod

# Custom URL
HOMESCREEN_URL=https://your-app.com node screenshot-capture.js
```

## Features

### 📱 Device Coverage
- **Desktop**: 1920x1080, 1366x768
- **Tablet**: 768x1024, 1024x768 (portrait/landscape)
- **Mobile**: iPhone sizes (375x667, 414x896), Android (360x800)

### 🌐 Browser Support
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### 🎭 UI States
- **Default**: Standard page load
- **Loading**: Simulated loading overlay
- **Interactive**: Focus on interactive elements
- **Hover**: Hover effects on navigation/buttons

### ♿ Accessibility Modes
- **Normal**: Default appearance
- **High Contrast**: Enhanced contrast for visibility
- **Reduced Motion**: Respects motion preferences
- **Focus Visible**: Enhanced focus indicators

## Output Structure

```
docs/ui-analysis/
└── screenshots/
    └── [timestamp]/
        ├── desktop/
        ├── tablet/
        ├── mobile/
        ├── report.json
        └── README.md
```

## Configuration

Edit `screenshot-capture.js` to customize:

```javascript
const CONFIG = {
  baseUrl: process.env.HOMESCREEN_URL || 'http://localhost:3000',
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: { /* custom viewports */ },
  states: ['default', 'loading', 'interactive', 'hover'],
  accessibilityModes: [ /* custom modes */ ]
};
```

## Usage Examples

### Basic Capture
```bash
node screenshot-capture.js
```

### With Custom URL
```bash
HOMESCREEN_URL=https://staging.example.com node screenshot-capture.js
```

### Integration with CI/CD
```bash
# In your CI pipeline
npm install
HOMESCREEN_URL=$STAGING_URL npm run capture:prod
```

## Advanced Features

### Custom Viewport
```javascript
// Add to CONFIG.viewports
custom: [
  { name: 'ultra-wide', width: 3440, height: 1440 }
]
```

### Custom UI State
```javascript
// Add to simulateUIState method
case 'modal-open':
  await page.click('[data-testid="open-modal"]');
  await page.waitForSelector('[data-testid="modal"]');
  break;
```

### Custom Accessibility Mode
```javascript
// Add to CONFIG.accessibilityModes
{
  name: 'dark-mode',
  settings: { 'prefers-color-scheme': 'dark' }
}
```

## Troubleshooting

### Browser Installation Issues
```bash
npx playwright install
```

### Permission Errors
```bash
chmod +x screenshot-capture.js
```

### Memory Issues (Large Sites)
```javascript
// Reduce concurrent captures
const CONFIG = {
  browsers: ['chromium'], // Use only one browser
  // ... reduce viewports/states
};
```

## Integration

### With Playwright Tests
```javascript
// tests/visual.spec.js
const ScreenshotCapture = require('../scripts/screenshot-capture');

test('visual regression', async () => {
  const capture = new ScreenshotCapture();
  const report = await capture.run();
  expect(report.totalScreenshots).toBeGreaterThan(0);
});
```

### With GitHub Actions
```yaml
# .github/workflows/screenshots.yml
name: UI Screenshots
on: [push]
jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run capture:prod
      - uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: docs/ui-analysis/screenshots/
```

## Memory Usage

This script stores the location in team memory for reuse:

```bash
# Memory key: ui-tools/screenshot-capture
# Location: /scripts/screenshot-capture.js
# Usage: node scripts/screenshot-capture.js
```

## Support

- For bugs, open an issue in the main repository
- For feature requests, see the enhancement guidelines
- For custom configurations, refer to Playwright documentation