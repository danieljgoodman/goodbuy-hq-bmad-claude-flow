/**
 * Color contrast calculation utilities following WCAG guidelines
 * Uses colors from colors.md CSS variables for consistency
 */

// Helper function to parse CSS color values to RGB
export function parseColor(color: string): { r: number; g: number; b: number } {
  // Handle CSS variables
  if (color.startsWith('var(')) {
    // Get the actual computed value from CSS
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const variableName = color.match(/var\(([^)]+)\)/)?.[1];
      if (variableName) {
        color = computedStyle.getPropertyValue(variableName).trim();
      }
    }
  }

  // Remove # if present
  color = color.replace('#', '');

  // Convert 3-digit hex to 6-digit
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  return { r, g, b };
}

// Calculate relative luminance according to WCAG formula
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Calculate contrast ratio between two colors
export function calculateContrastRatio(color1: string, color2: string): number {
  try {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);

    const l1 = getRelativeLuminance(rgb1);
    const l2 = getRelativeLuminance(rgb2);

    // WCAG contrast ratio formula
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  } catch (error) {
    console.warn('Error calculating contrast ratio:', error);
    return 1; // Return minimum ratio on error
  }
}

// Check WCAG compliance levels
export function checkWCAGCompliance(ratio: number): {
  AA: { normal: boolean; large: boolean };
  AAA: { normal: boolean; large: boolean };
} {
  return {
    AA: {
      normal: ratio >= 4.5,  // WCAG AA normal text
      large: ratio >= 3.0    // WCAG AA large text (18pt+ or 14pt+ bold)
    },
    AAA: {
      normal: ratio >= 7.0,  // WCAG AAA normal text
      large: ratio >= 4.5    // WCAG AAA large text
    }
  };
}

// Validate color combinations from colors.md
export function validateColorSystem(): {
  color: string;
  background: string;
  ratio: number;
  wcag: ReturnType<typeof checkWCAGCompliance>;
}[] {
  const colorCombinations = [
    { color: 'var(--foreground)', background: 'var(--background)' },
    { color: 'var(--primary-foreground)', background: 'var(--primary)' },
    { color: 'var(--secondary-foreground)', background: 'var(--secondary)' },
    { color: 'var(--muted-foreground)', background: 'var(--muted)' },
    { color: 'var(--accent-foreground)', background: 'var(--accent)' },
    { color: 'var(--card-foreground)', background: 'var(--card)' },
  ];

  return colorCombinations.map(({ color, background }) => {
    const ratio = calculateContrastRatio(color, background);
    const wcag = checkWCAGCompliance(ratio);
    
    return {
      color,
      background, 
      ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
      wcag
    };
  });
}