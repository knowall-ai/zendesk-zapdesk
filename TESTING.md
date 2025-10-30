# Testing Guide

## Overview

This project includes comprehensive unit tests for the i18n (internationalization) system to ensure translation loading, locale handling, and security features work correctly.

## Setup

### Install Test Dependencies

```bash
npm install --save-dev jest @babel/preset-env babel-jest @testing-library/react @testing-library/jest-dom
```

### Babel Configuration for Jest

Create or update `.babelrc` to support Jest:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
  ]
}
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### i18n System Tests (`src/lib/__tests__/i18n.test.js`)

The i18n test suite covers:

#### 1. **Nested Key Resolution**
- ✅ Resolves simple nested keys (e.g., `ui.loading`)
- ✅ Resolves deeply nested keys (e.g., `errors.noLightningAddress`)
- ✅ Throws errors for invalid nested keys
- ✅ Handles partial matches correctly

#### 2. **Locale Fallback Chain**
- ✅ Loads exact locale match (e.g., `es`)
- ✅ Falls back from regional to base locale (e.g., `es-MX` → `es`)
- ✅ Falls back to English for unsupported locales
- ✅ Falls back to English for invalid locales
- ✅ Keeps existing translations when all loads fail

#### 3. **Sanitization Function (Security)**
- ✅ Sanitizes locale with path traversal attempts
- ✅ Removes special characters from locale
- ✅ Limits locale length to 10 characters
- ✅ Only allows alphanumeric and hyphens
- ✅ Returns "en" for empty strings after sanitization

#### 4. **Whitelist Validation (Path Traversal Protection)**
- ✅ Only loads translations from whitelist
- ✅ Returns null for non-whitelisted locales
- ✅ Returns null for invalid paths
- ✅ Only supports `en` and `es` locales

#### 5. **Missing Translation Handling**
- ✅ Throws error with key name for missing translations
- ✅ Throws error for non-string keys
- ✅ Throws error for null/undefined keys

#### 6. **Placeholder Replacement**
- ✅ Replaces placeholders in translations
- ✅ Handles multiple placeholders
- ✅ Handles missing placeholder context gracefully

#### 7. **Async Loading (Race Condition Prevention)**
- ✅ `loadTranslations()` returns a Promise
- ✅ Awaits translation loading before use
- ✅ Throws error if translations fail to load

#### 8. **Constructor Initialization**
- ✅ Initializes with default locale from manifest
- ✅ Loads English by default

#### 9. **Translation Key Consistency**
- ✅ Ensures matching keys between `en` and `es`
- ✅ Verifies all required UI keys exist in both languages

## Coverage Goals

Target coverage: **70%** for all metrics
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test File Structure

```
src/
  lib/
    __tests__/
      i18n.test.js      # i18n system tests
    i18n.js             # i18n implementation
__mocks__/
  styleMock.js          # CSS module mock
  fileMock.js           # File import mock
jest.config.js          # Jest configuration
```

## Adding New Tests

When adding new features to the i18n system, add corresponding tests:

1. Create test file in `src/lib/__tests__/`
2. Follow existing test structure with `describe` and `test` blocks
3. Test both success and error scenarios
4. Include security tests for user input handling

### Example Test

```javascript
describe('New Feature', () => {
  test('should handle new feature correctly', async () => {
    await i18n.loadTranslations('en');
    const result = i18n.newFeature('input');
    expect(result).toBe('expected output');
  });

  test('should throw error for invalid input', () => {
    expect(() => {
      i18n.newFeature(null);
    }).toThrow('Expected error message');
  });
});
```

## Continuous Integration

Tests should run automatically on:
- Every pull request
- Every push to `main` branch
- Before creating releases

Add to `.github/workflows/Build and Release.yml`:

```yaml
- name: Run tests
  run: npm test

- name: Check test coverage
  run: npm run test:coverage
```

## Critical Tests to Always Pass

These tests ensure security and stability:
1. ✅ Path traversal protection (whitelist validation)
2. ✅ Locale sanitization (prevents injection attacks)
3. ✅ Race condition prevention (async await)
4. ✅ Translation key validation
5. ✅ Fallback chain integrity

## Troubleshooting

### Jest Not Found

```bash
npm install --save-dev jest
```

### Babel Transform Errors

Install babel-jest:
```bash
npm install --save-dev babel-jest @babel/preset-env
```

### Module Resolution Errors

Check `jest.config.js` `moduleNameMapper` settings.

### Coverage Below Threshold

Run with coverage to see which lines need tests:
```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` in browser to see detailed coverage report.

## Best Practices

1. **Test behavior, not implementation** - Test what the function does, not how it does it
2. **Use descriptive test names** - Names should explain what's being tested
3. **One assertion per test** (when possible) - Makes failures easier to debug
4. **Test edge cases** - Empty strings, null, undefined, very long strings, special characters
5. **Mock external dependencies** - Don't test Zendesk API, only your code
6. **Keep tests fast** - Unit tests should run in milliseconds
7. **Update tests with code changes** - Tests should always reflect current behavior

## Security Testing

Always test security-critical code:

```javascript
describe('Security', () => {
  test('should prevent path traversal', () => {
    const malicious = '../../../etc/passwd';
    const result = i18n.sanitizeLocale(malicious);
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  test('should prevent code injection', () => {
    const malicious = '<script>alert(1)</script>';
    const result = i18n.sanitizeLocale(malicious);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});
```

## Future Test Additions

Consider adding tests for:
- React component rendering (using @testing-library/react)
- Zendesk API integration (with mocked ZAFClient)
- Lightning address validation
- QR code generation
- Payment flow end-to-end tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zendesk Apps Testing Guide](https://developer.zendesk.com/documentation/apps/getting-started/testing-your-apps/)
