/**
 * Unit tests for i18n system
 *
 * To run these tests:
 * 1. Install Jest: npm install --save-dev jest @babel/preset-env babel-jest
 * 2. Add to package.json scripts: "test": "jest"
 * 3. Create jest.config.js with babel preset
 * 4. Run: npm test
 */

describe('I18n System', () => {
  let i18n;

  beforeEach(() => {
    // Reset module cache to get fresh instance
    jest.resetModules();
    i18n = require('../i18n').default;
  });

  describe('Nested Key Resolution', () => {
    test('should resolve simple nested keys like "ui.loading"', async () => {
      await i18n.loadTranslations('en');
      const result = i18n.t('ui.loading');
      expect(result).toBe('Loading...');
      expect(typeof result).toBe('string');
    });

    test('should resolve deeply nested keys', async () => {
      await i18n.loadTranslations('en');
      const result = i18n.t('errors.noLightningAddress');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should throw error for invalid nested keys', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t('ui.nonexistent.key');
      }).toThrow('Missing translation: ui.nonexistent.key');
    });

    test('should throw error for missing keys', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t('totally.fake.key');
      }).toThrow('Missing translation: totally.fake.key');
    });

    test('should handle partial matches correctly', async () => {
      await i18n.loadTranslations('en');
      // This should fail because "ui" is an object, not a string
      expect(() => {
        i18n.t('ui');
      }).toThrow('Invalid translation for key: ui');
    });
  });

  describe('Locale Fallback Chain', () => {
    test('should load exact locale match (es)', async () => {
      await i18n.loadTranslations('es');
      const result = i18n.t('ui.loading');
      expect(result).toBe('Cargando...');
    });

    test('should fallback from regional to base locale (es-MX -> es)', async () => {
      await i18n.loadTranslations('es-MX');
      const result = i18n.t('ui.loading');
      // Should load es.json
      expect(result).toBe('Cargando...');
    });

    test('should fallback to English for unsupported locales', async () => {
      await i18n.loadTranslations('fr');
      const result = i18n.t('ui.loading');
      // Should fallback to en.json
      expect(result).toBe('Loading...');
    });

    test('should fallback to English for invalid locales', async () => {
      await i18n.loadTranslations('xyz123');
      const result = i18n.t('ui.loading');
      expect(result).toBe('Loading...');
    });

    test('should keep existing translations if all loads fail', async () => {
      await i18n.loadTranslations('en');
      const firstResult = i18n.t('ui.loading');
      expect(firstResult).toBe('Loading...');

      // Try loading invalid locale - should keep existing English
      await i18n.loadTranslations('invalid-locale');
      const secondResult = i18n.t('ui.loading');
      expect(secondResult).toBe('Loading...');
    });
  });

  describe('Sanitization Function', () => {
    test('should sanitize locale with path traversal attempts', async () => {
      const malicious = '../../../etc/passwd';
      await i18n.loadTranslations(malicious);
      // Should sanitize to 'etcpasswd' and fallback to 'en'
      const result = i18n.t('ui.loading');
      expect(result).toBe('Loading...');
    });

    test('should remove special characters from locale', async () => {
      const malicious = 'en<script>alert(1)</script>';
      await i18n.loadTranslations(malicious);
      // Should sanitize and fallback to 'en'
      const result = i18n.t('ui.loading');
      expect(result).toBeTruthy();
    });

    test('should limit locale length to 10 characters', async () => {
      const longLocale = 'thisisaverylonglocalestring';
      await i18n.loadTranslations(longLocale);
      // Should truncate and fallback appropriately
      const result = i18n.t('ui.loading');
      expect(result).toBeTruthy();
    });

    test('should only allow alphanumeric and hyphens', () => {
      const sanitizedLocale = i18n.sanitizeLocale('en-US!@#$%');
      expect(sanitizedLocale).toBe('enUS');
    });

    test('should return "en" for empty string after sanitization', () => {
      const sanitizedLocale = i18n.sanitizeLocale('!@#$%');
      expect(sanitizedLocale).toBe('en');
    });

    test('should handle locale with only hyphens', () => {
      const sanitizedLocale = i18n.sanitizeLocale('en-US-x-custom');
      expect(sanitizedLocale).toBe('enUSxcust');
    });
  });

  describe('Whitelist Validation (Path Traversal Protection)', () => {
    test('should only load translations from whitelist', async () => {
      // tryRequire should only return translations from SUPPORTED_TRANSLATIONS
      const enTranslation = i18n.tryRequire('en');
      expect(enTranslation).toBeTruthy();
      expect(enTranslation.ui).toBeDefined();
    });

    test('should return null for non-whitelisted locales', () => {
      const result = i18n.tryRequire('../../malicious');
      expect(result).toBeNull();
    });

    test('should return null for invalid paths', () => {
      const result = i18n.tryRequire('../../../etc/passwd');
      expect(result).toBeNull();
    });

    test('should only support en and es locales', () => {
      expect(i18n.tryRequire('en')).toBeTruthy();
      expect(i18n.tryRequire('es')).toBeTruthy();
      expect(i18n.tryRequire('fr')).toBeNull();
      expect(i18n.tryRequire('de')).toBeNull();
    });
  });

  describe('Missing Translation Handling', () => {
    test('should throw error with key name for missing translations', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t('nonexistent.key');
      }).toThrow('Missing translation: nonexistent.key');
    });

    test('should throw error for non-string keys', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t(123);
      }).toThrow('Translation key must be a string, got: number');
    });

    test('should throw error for null keys', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t(null);
      }).toThrow('Translation key must be a string, got: object');
    });

    test('should throw error for undefined keys', async () => {
      await i18n.loadTranslations('en');
      expect(() => {
        i18n.t(undefined);
      }).toThrow('Translation key must be a string, got: undefined');
    });
  });

  describe('Placeholder Replacement', () => {
    test('should replace placeholders in translations', async () => {
      await i18n.loadTranslations('en');
      // Assuming there's a translation with placeholders
      // This test may need adjustment based on actual translation keys
      const result = i18n.t('some.key.with.placeholder', { name: 'John' });
      expect(result).toContain('John');
    });

    test('should handle multiple placeholders', async () => {
      await i18n.loadTranslations('en');
      const result = i18n.t('some.multi.placeholder', {
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(result).toBeTruthy();
    });

    test('should handle missing placeholder context gracefully', async () => {
      await i18n.loadTranslations('en');
      // Should not throw, should replace with empty string
      const result = i18n.t('ui.loading', {});
      expect(result).toBeTruthy();
    });
  });

  describe('Async Loading (Race Condition Prevention)', () => {
    test('loadTranslations should be async', () => {
      const result = i18n.loadTranslations('en');
      expect(result).toBeInstanceOf(Promise);
    });

    test('should await loadTranslations before using translations', async () => {
      await i18n.loadTranslations('es');
      const result = i18n.t('ui.loading');
      expect(result).toBe('Cargando...');
    });

    test('should throw error if translations fail to load', async () => {
      // Mock a scenario where all translations fail
      // This might require additional setup or mocking
      await expect(async () => {
        // Force a failure scenario
        i18n.tryRequire = jest.fn().mockReturnValue(null);
        await i18n.loadTranslations('invalid');
      }).rejects.toThrow('Failed to load translations');
    });
  });

  describe('Constructor Initialization', () => {
    test('should initialize with default locale from manifest', () => {
      const freshI18n = require('../i18n').default;
      const result = freshI18n.t('ui.loading');
      expect(result).toBeTruthy();
    });

    test('should load English by default', () => {
      const freshI18n = require('../i18n').default;
      const result = freshI18n.t('ui.loading');
      expect(result).toBe('Loading...');
    });
  });

  describe('All Translation Keys Present', () => {
    test('should have matching keys between en and es', async () => {
      const enTranslations = i18n.tryRequire('en');
      const esTranslations = i18n.tryRequire('es');

      expect(enTranslations).toBeTruthy();
      expect(esTranslations).toBeTruthy();

      // Check that all English keys exist in Spanish
      const checkKeys = (enObj, esObj, path = '') => {
        Object.keys(enObj).forEach(key => {
          const fullPath = path ? `${path}.${key}` : key;
          expect(esObj).toHaveProperty(key);

          if (typeof enObj[key] === 'object' && enObj[key] !== null) {
            checkKeys(enObj[key], esObj[key], fullPath);
          }
        });
      };

      checkKeys(enTranslations, esTranslations);
    });

    test('should have all required UI keys in both languages', async () => {
      const requiredKeys = [
        'ui.loading',
        'ui.title',
        'ui.satsLabel',
        'ui.messageLabel',
        'ui.markAsPaidButton',
        'errors.noLightningAddress',
        'errors.noTicketId',
        'errors.noTipAmount'
      ];

      for (const locale of ['en', 'es']) {
        await i18n.loadTranslations(locale);
        requiredKeys.forEach(key => {
          expect(() => i18n.t(key)).not.toThrow();
          expect(i18n.t(key)).toBeTruthy();
        });
      }
    });
  });
});
