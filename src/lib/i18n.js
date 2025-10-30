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

  loadTranslations (locale = 'en') {
    console.log(`[i18n] Loading translations for locale: ${locale}`)

    translations = this.tryRequire(locale) ||
                   this.tryRequire(locale.replace(/-.+$/, '')) ||
                   translations ||
                   this.tryRequire('en')

    // Log which locale was actually loaded
    if (this.tryRequire(locale)) {
      console.log(`[i18n] Loaded translations: ${locale}`)
    } else if (this.tryRequire(locale.replace(/-.+$/, ''))) {
      console.log(`[i18n] Loaded translations: ${locale.replace(/-.+$/, '')} (fallback from ${locale})`)
    } else {
      console.log(`[i18n] Loaded translations: en (fallback)`)
    }
  }
}

export default new I18n(manifest.defaultLocale)
