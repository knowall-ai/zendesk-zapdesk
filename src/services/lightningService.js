/**
 * Lightning Service
 * Handles Lightning Network related operations
 */

import QRCode from "qrcode";
import {
  lnurlFromLightningAddress,
  lightningUriFromAddress,
} from "../utils/lnurl";

/**
 * Validate a Lightning address
 * @param {string} address - Lightning address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidLightningAddress(address) {
  return address && address.includes("@");
}

/**
 * Generate QR code data URL from Lightning address and amount
 * @param {string} lightningAddress - Lightning address (e.g., alice@example.com)
 * @param {number} amountSats - Amount in satoshis
 * @returns {Promise<Object>} Object containing qrDataUrl and lnurlString
 */
export async function generateLightningQR(lightningAddress, amountSats) {
  try {
    if (!isValidLightningAddress(lightningAddress)) {
      throw new Error("Invalid Lightning Address");
    }

    // Generate Lightning URI
    const lnurl = await lightningUriFromAddress(lightningAddress, amountSats);
    console.log("[Lightning Service] LNURL generated:", lnurl);

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(lnurl);
    console.log("[Lightning Service] QR code generated");

    return {
      qrDataUrl,
      lnurlString: lnurl,
    };
  } catch (error) {
    console.error("[Lightning Service] Error generating QR:", error);
    throw new Error("Failed to generate LNURL / QR code");
  }
}

/**
 * Generate LNURL from Lightning address
 * @param {string} lightningAddress - Lightning address (e.g., alice@example.com)
 * @param {number} amountSats - Amount in satoshis
 * @returns {Promise<string>} LNURL string
 */
export async function generateLNURL(lightningAddress, amountSats) {
  try {
    if (!isValidLightningAddress(lightningAddress)) {
      throw new Error("Invalid Lightning Address");
    }

    const lnurl = await lnurlFromLightningAddress(lightningAddress, amountSats);
    console.log("[Lightning Service] LNURL generated:", lnurl);

    return lnurl;
  } catch (error) {
    console.error("[Lightning Service] Error generating LNURL:", error);
    throw error;
  }
}

/**
 * Parse Lightning address to get username and domain
 * @param {string} lightningAddress - Lightning address (e.g., alice@example.com)
 * @returns {Object} Object containing username and domain
 */
export function parseLightningAddress(lightningAddress) {
  if (!isValidLightningAddress(lightningAddress)) {
    return { username: null, domain: null };
  }

  const [username, domain] = lightningAddress.split("@");
  return { username, domain };
}

/**
 * Format satoshi amount for display
 * @param {number} sats - Amount in satoshis
 * @returns {string} Formatted string (e.g., "1,000 sats")
 */
export function formatSatsAmount(sats) {
  return `${sats.toLocaleString()} sats`;
}

/**
 * Convert satoshis to millisatoshis
 * @param {number} sats - Amount in satoshis
 * @returns {number} Amount in millisatoshis
 */
export function satsToMillisats(sats) {
  return sats * 1000;
}

/**
 * Convert millisatoshis to satoshis
 * @param {number} msats - Amount in millisatoshis
 * @returns {number} Amount in satoshis
 */
export function millisatsToSats(msats) {
  return Math.floor(msats / 1000);
}
