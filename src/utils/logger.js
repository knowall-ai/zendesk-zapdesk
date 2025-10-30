/**
 * Centralized logger utility
 * Only logs in development mode to avoid console pollution in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  /**
   * Log warnings
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;
