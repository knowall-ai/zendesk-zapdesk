import manifest from '../../manifest.json'

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
    this.loadTranslations(locale)
  }

  tryRequire (locale) {
    try {
      return require(`../../translations/${locale}.json`)
    } catch (e) {
      return null
    }
  }

  /**
   * Translate key with currently loaded translations,
   * optional context to replace the placeholders in the translation
   * @param {String} key
   * @param {Object} context object contains placeholder/value pairs
   * @return {String} translated string
   */
  t (key, context) {
    const keyType = typeof key
    if (keyType !== 'string') throw new Error(`Translation key must be a string, got: ${keyType}`)

    // Handle nested keys (e.g., "ui.loading" -> translations.ui.loading)
    const keys = key.split('.')
    let template = translations
    for (const k of keys) {
      if (!template || typeof template !== 'object') {
        throw new Error(`Missing translation: ${key}`)
      }
      template = template[k]
    }

    if (!template) throw new Error(`Missing translation: ${key}`)
    if (typeof template !== 'string') throw new Error(`Invalid translation for key: ${key}`)

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

  loadTranslations (locale = 'en') {
    // Sanitize locale to prevent path traversal attacks
    const sanitizedLocale = this.sanitizeLocale(locale)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[i18n] Loading translations for locale: ${sanitizedLocale}`)
    }

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

    // Log which locale was actually loaded (only in development)
    if (process.env.NODE_ENV === 'development') {
      if (loadedLocale === sanitizedLocale) {
        console.log(`[i18n] Loaded translations: ${loadedLocale}`)
      } else if (loadedLocale === baseLocale) {
        console.log(`[i18n] Loaded translations: ${loadedLocale} (fallback from ${sanitizedLocale})`)
      } else if (loadedLocale === 'existing') {
        console.log(`[i18n] Keeping existing translations`)
      } else {
        console.log(`[i18n] Loaded translations: en (fallback)`)
      }
    }
  }
}

export default new I18n(manifest.defaultLocale)
