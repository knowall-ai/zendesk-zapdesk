import { encodeBech32, convertBits } from "./bech32";

/**
 * Convert a Lightning Address (like alice@example.com)
 * into a valid LNURL-pay bech32 string with amount.
 * @param {string} lightningAddress - e.g. 'alice@example.com'
 * @param {number} amountSats - e.g. 1000 sats
 * @returns {Promise<string>} - bech32 LNURL string
 */
export async function lnurlFromLightningAddress(lightningAddress, amountSats) {
  console.log("[lightningAddress, amountSats]", lightningAddress, amountSats);

  if (!lightningAddress || !lightningAddress.includes("@")) {
    throw new Error("Invalid Lightning Address");
  }

  const [name, domain] = lightningAddress.split("@");

  // convert sats → millisatoshis
  const amountMsat = amountSats * 1000;

  // Construct the lnurlp endpoint with amount query
  const url = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(
    name
  )}?amount=${amountMsat}`;

  console.log("[LNURL URL]", url);

  // encode url as utf8 bytes
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(url.toLowerCase()));

  // convert bytes (8-bit) to 5-bit words
  const words = convertBits(bytes, 8, 5, true);
  if (!words) throw new Error("convertBits failed");

  const bech32 = encodeBech32("lnurl", words);
  return bech32;
}

/**
 * Convert a Lightning Address (like alice@example.com)
 * into a Lightning URI string with an optional amount.
 * @param {string} lightningAddress - e.g. 'alice@example.com'
 * @param {number} [amountSats] - e.g. 1000 sats
 * @returns {string} - Lightning URI (e.g. lightning:alice@example.com?amount=1000sat)
 */
export function lightningUriFromAddress(lightningAddress, amountSats) {
  console.log("[lightningAddress, amountSats]", lightningAddress, amountSats);

  if (!lightningAddress || !lightningAddress.includes("@")) {
    throw new Error("Invalid Lightning Address");
  }

  // Base lightning URI
  let uri = `lightning:${lightningAddress}`;

  // Add amount if provided
  if (amountSats && !isNaN(amountSats)) {
    // Amount should be in sats (some wallets also accept "msat")
    uri += `?amount=${amountSats}sat`;
  }

  console.log("[Lightning URI]", uri);
  return uri;
}
