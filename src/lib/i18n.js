import manifest from '../../manifest.json'
import logger from '../utils/logger'

// Static map of supported translations (prevents path traversal attacks)
const SUPPORTED_TRANSLATIONS = {
  'en': require('../../translations/en.json'),
  'es': require('../../translations/es.json')
}

// map to store the key/translation pairs of the loaded language
let translations

/**
 * Replace placeholders in the given string with context
 * @param {String} str string with placeholders to be replaced
 * @param {Object} context object contains placeholder/value pairs
 * @return {String} formatted string
 */
function parsePlaceholders (str, context) {
  const regex = /{{(.*?)}}/g
  const matches = []
  let match

  do {
    match = regex.exec(str)
    if (match) matches.push(match)
  } while (match)

  return matches.reduce((str, match) => {
    const newRegex = new RegExp(match[0], 'g')
    return str.replace(newRegex, context[match[1]] || '')
  }, str)
}

class I18n {
  constructor (locale) {
    // Load default English translations as fallback
    // This ensures t() doesn't fail if called before loadTranslations()
    // App.jsx will call loadTranslations() with user locale before rendering
    translations = this.tryRequire('en')

    if (!translations) {
      throw new Error('Failed to load default English translations')
    }
  }

  /**
   * Get translation from whitelist map (prevents path traversal attacks)
   * @param {String} locale - Locale to load
   * @return {Object|null} Translation object or null if not found
   */
  tryRequire (locale) {
    return SUPPORTED_TRANSLATIONS[locale] || null
  }

  /**
   * Translate key with currently loaded translations,
   * optional context to replace the placeholders in the translation
   * @param {String} key
   * @param {Object} context object contains placeholder/value pairs
   * @return {String} translated string (or key as fallback if missing)
   */
  t (key, context) {
    const keyType = typeof key
    if (keyType !== 'string') {
      logger.error(`Translation key must be a string, got: ${keyType}`)
      return String(key) // Return stringified key as fallback
    }

    // Handle nested keys (e.g., "ui.loading" -> translations.ui.loading)
    const keys = key.split('.')
    let template = translations
    for (const k of keys) {
      if (!template || typeof template !== 'object') {
        logger.warn(`Missing translation: ${key}`)
        return key // Return key as fallback instead of throwing
      }
      template = template[k]
    }

    if (!template) {
      logger.warn(`Missing translation: ${key}`)
      return key // Return key as fallback instead of throwing
    }

    if (typeof template !== 'string') {
      logger.warn(`Invalid translation for key: ${key} (expected string, got ${typeof template})`)
      return key // Return key as fallback instead of throwing
    }

    return parsePlaceholders(template, context)
  }

  /**
   * Validates and sanitizes locale string to prevent path traversal attacks
   * @param {String} locale - Locale string to validate
   * @return {String} Sanitized locale string
   */
  sanitizeLocale (locale) {
    // Only allow alphanumeric characters and hyphens, max 10 chars
    const sanitized = locale.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 10)
    return sanitized || 'en'
  }

  /**
   * Load translations for the specified locale (async for future-proofing)
   * @param {String} locale - Locale to load
   * @return {Promise<void>} Promise that resolves when translations are loaded
   */
  async loadTranslations (locale = 'en') {
    // Sanitize locale to prevent path traversal attacks
    const sanitizedLocale = this.sanitizeLocale(locale)

    logger.log(`[i18n] Loading translations for locale: ${sanitizedLocale}`)

    // Try loading in priority order, storing results to avoid redundant calls
    const exactMatch = this.tryRequire(sanitizedLocale)
    const baseLocale = sanitizedLocale.replace(/-.+$/, '')
    const baseMatch = sanitizedLocale !== baseLocale ? this.tryRequire(baseLocale) : null
    const fallbackMatch = this.tryRequire('en')

    // Determine which translation to use
    let loadedLocale = 'en'
    if (exactMatch) {
      translations = exactMatch
      loadedLocale = sanitizedLocale
    } else if (baseMatch) {
      translations = baseMatch
      loadedLocale = baseLocale
    } else if (translations) {
      // Keep existing translations if available
      loadedLocale = 'existing'
    } else {
      translations = fallbackMatch
      loadedLocale = 'en'
    }

    // Ensure translations were loaded successfully
    if (!translations) {
      throw new Error('Failed to load translations')
    }

    // Log which locale was actually loaded
    if (loadedLocale === sanitizedLocale) {
      logger.log(`[i18n] Loaded translations: ${loadedLocale}`)
    } else if (loadedLocale === baseLocale) {
      logger.log(`[i18n] Loaded translations: ${loadedLocale} (fallback from ${sanitizedLocale})`)
    } else if (loadedLocale === 'existing') {
      logger.log(`[i18n] Keeping existing translations`)
    } else {
      logger.log(`[i18n] Loaded translations: en (fallback)`)
    }
  }
}

export default new I18n(manifest.defaultLocale)
