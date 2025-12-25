/**
 * Color Contrast Validation Utilities Tests
 * Tests for WCAG 2.1 AA compliant contrast ratio calculations
 */

import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  isLargeText,
  getComplianceLevel,
  validateColorContrast,
  validateColorCombinations,
  meetsWCAGStandards,
  getSuggestedColors,
  validateThemeColors,
  THEME_COLOR_TESTS
} from '../colorContrast';

describe('Color Contrast Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('fff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gggggg')).toBeNull();
      expect(hexToRgb('#12345')).toBeNull();
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate correct luminance for white', () => {
      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 3);
    });

    it('should calculate correct luminance for black', () => {
      const luminance = getRelativeLuminance(0, 0, 0);
      expect(luminance).toBeCloseTo(0, 3);
    });

    it('should calculate luminance for mid-gray', () => {
      const luminance = getRelativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate maximum contrast for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate minimum contrast for same colors', () => {
      const ratio = calculateContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle color order (lighter/darker)', () => {
      const ratio1 = calculateContrastRatio('#000000', '#ffffff');
      const ratio2 = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio1).toBeCloseTo(ratio2, 3);
    });

    it('should throw error for invalid colors', () => {
      expect(() => calculateContrastRatio('invalid', '#ffffff')).toThrow();
      expect(() => calculateContrastRatio('#ffffff', 'invalid')).toThrow();
    });
  });

  describe('isLargeText', () => {
    it('should identify large text correctly', () => {
      expect(isLargeText(24, 400)).toBe(true); // 18pt regular
      expect(isLargeText(18.66, 700)).toBe(true); // 14pt bold
      expect(isLargeText(20, 700)).toBe(true); // Above 14pt bold
    });

    it('should identify normal text correctly', () => {
      expect(isLargeText(16, 400)).toBe(false); // Normal text
      expect(isLargeText(18, 400)).toBe(false); // Below 18pt regular
      expect(isLargeText(18, 700)).toBe(false); // Below 14pt bold
    });
  });

  describe('getComplianceLevel', () => {
    it('should return correct levels for normal text', () => {
      expect(getComplianceLevel(7.5, false)).toBe('AAA');
      expect(getComplianceLevel(5.0, false)).toBe('AA');
      expect(getComplianceLevel(3.5, false)).toBe('A');
      expect(getComplianceLevel(2.5, false)).toBe('FAIL');
    });

    it('should return correct levels for large text', () => {
      expect(getComplianceLevel(7.5, true)).toBe('AAA');
      expect(getComplianceLevel(5.0, true)).toBe('AAA'); // Large text AAA is 4.5:1
      expect(getComplianceLevel(3.5, true)).toBe('AA');  // Large text AA is 3:1
      expect(getComplianceLevel(2.5, true)).toBe('FAIL');
    });
  });

  describe('validateColorContrast', () => {
    it('should validate high contrast colors', () => {
      const result = validateColorContrast('#000000', '#ffffff');
      expect(result.ratio).toBeCloseTo(21, 1);
      expect(result.level).toBe('AAA');
      expect(result.isAccessible).toBe(true);
      expect(result.recommendation).toBeUndefined();
    });

    it('should validate poor contrast colors', () => {
      const result = validateColorContrast('#cccccc', '#ffffff');
      expect(result.ratio).toBeLessThan(4.5);
      expect(result.level).toBe('FAIL');
      expect(result.isAccessible).toBe(false);
      expect(result.recommendation).toContain('Increase contrast ratio');
    });

    it('should handle large text options', () => {
      const result = validateColorContrast('#666666', '#ffffff', { isLargeText: true });
      expect(result.isAccessible).toBe(result.ratio >= 3);
    });

    it('should handle strict mode', () => {
      const result = validateColorContrast('#0ea5e9', '#ffffff', { strictMode: true });
      expect(result.isAccessible).toBe(result.ratio >= 7);
    });
  });

  describe('validateColorCombinations', () => {
    it('should validate multiple combinations', () => {
      const combinations = [
        { foreground: '#000000', background: '#ffffff', label: 'Black on White' },
        { foreground: '#cccccc', background: '#ffffff', label: 'Light Gray on White' }
      ];

      const results = validateColorCombinations(combinations);
      expect(results).toHaveLength(2);
      expect(results[0].label).toBe('Black on White');
      expect(results[0].isAccessible).toBe(true);
      expect(results[1].label).toBe('Light Gray on White');
      expect(results[1].isAccessible).toBe(false);
    });
  });

  describe('meetsWCAGStandards', () => {
    it('should check AA standards correctly', () => {
      expect(meetsWCAGStandards('#000000', '#ffffff', 'AA')).toBe(true);
      expect(meetsWCAGStandards('#cccccc', '#ffffff', 'AA')).toBe(false);
    });

    it('should check AAA standards correctly', () => {
      expect(meetsWCAGStandards('#000000', '#ffffff', 'AAA')).toBe(true);
      expect(meetsWCAGStandards('#666666', '#ffffff', 'AAA')).toBe(false);
    });

    it('should handle large text standards', () => {
      expect(meetsWCAGStandards('#666666', '#ffffff', 'AA', true)).toBe(true);
      expect(meetsWCAGStandards('#999999', '#ffffff', 'AA', true)).toBe(false);
    });

    it('should return false for invalid colors', () => {
      expect(meetsWCAGStandards('invalid', '#ffffff')).toBe(false);
    });
  });

  describe('getSuggestedColors', () => {
    it('should provide suggestions for poor contrast', () => {
      const result = getSuggestedColors('#cccccc', '#ffffff', 4.5);
      expect(result.suggestions).toContain('Consider darkening the foreground color');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should indicate when colors already meet target', () => {
      const result = getSuggestedColors('#000000', '#ffffff', 4.5);
      expect(result.suggestions[0]).toContain('already meet the target');
    });

    it('should handle invalid colors gracefully', () => {
      const result = getSuggestedColors('invalid', '#ffffff');
      expect(result.suggestions[0]).toContain('Invalid color format');
    });
  });

  describe('validateThemeColors', () => {
    it('should validate all predefined theme combinations', () => {
      const results = validateThemeColors();
      expect(results.length).toBe(Object.keys(THEME_COLOR_TESTS).length);
      
      results.forEach(result => {
        expect(result).toHaveProperty('combination');
        expect(result).toHaveProperty('ratio');
        expect(result).toHaveProperty('level');
        expect(result).toHaveProperty('isAccessible');
      });
    });

    it('should include specific theme combinations', () => {
      const results = validateThemeColors();
      const combinations = results.map(r => r.combination);
      
      expect(combinations).toContain('primaryOnWhite');
      expect(combinations).toContain('whiteOnPrimary');
      expect(combinations).toContain('errorOnWhite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very similar colors', () => {
      const result = validateColorContrast('#ffffff', '#fefefe');
      expect(result.ratio).toBeCloseTo(1, 1);
      expect(result.isAccessible).toBe(false);
    });

    it('should handle mid-range contrasts', () => {
      const result = validateColorContrast('#666666', '#ffffff');
      expect(result.ratio).toBeGreaterThan(3);
      expect(result.ratio).toBeLessThan(7);
    });

    it('should provide appropriate recommendations', () => {
      const poorResult = validateColorContrast('#cccccc', '#ffffff');
      expect(poorResult.recommendation).toContain('4.5:1');
      
      const okResult = validateColorContrast('#666666', '#ffffff');
      if (okResult.recommendation) {
        expect(okResult.recommendation).toContain('AAA');
      }
    });
  });
});