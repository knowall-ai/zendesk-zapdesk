/**
 * Centralized logger utility
 * - Info logs only in development to avoid console pollution
 * - Errors always logged (even in production) for debugging
 */

// Strict development check for Webpack builds
// Webpack's DefinePlugin replaces process.env.NODE_ENV at build time
// Only logs debug info if NODE_ENV is explicitly 'development'
// If NODE_ENV is undefined/null, treats as production (safe default)
const isDevelopment = typeof process !== 'undefined' &&
                      process.env &&
                      process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information (development only)
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors (ALWAYS logged, even in production, for debugging)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    // Always log errors, even in production, to help with debugging
    console.error(...args);
  },

  /**
   * Log warnings (development only)
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information (development only)
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;
