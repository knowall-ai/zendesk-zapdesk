// Minimal bech32 encoder (for LNURL) — implemented in JS

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function polymod(values) {
  const GENERATORS = [
    0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3,
  ];
  let chk = 1;
  for (let p = 0; p < values.length; ++p) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[p];
    for (let i = 0; i < 5; ++i) {
      if ((top >> i) & 1) chk ^= GENERATORS[i];
    }
  }
  return chk;
}

function hrpExpand(hrp) {
  const ret = [];
  for (let i = 0; i < hrp.length; ++i) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; ++i) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function createChecksum(hrp, data) {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const ret = [];
  for (let p = 0; p < 6; ++p) ret.push((mod >> (5 * (5 - p))) & 31);
  return ret;
}

function encodeBech32(hrp, data) {
  const combined = data.concat(createChecksum(hrp, data));
  let ret = hrp + "1";
  for (let p = 0; p < combined.length; ++p) ret += CHARSET.charAt(combined[p]);
  return ret;
}

function convertBits(data, from, to, pad) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << to) - 1;
  for (let p = 0; p < data.length; ++p) {
    acc = (acc << from) | data[p];
    bits += from;
    while (bits >= to) {
      bits -= to;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || (acc << (to - bits)) & maxv) {
    return null;
  }
  return ret;
}

export { encodeBech32, convertBits };
