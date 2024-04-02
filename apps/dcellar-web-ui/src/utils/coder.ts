import * as flatted from 'flatted';

export const signTypedDataV4 = async (provider: any, addr: string, message: string) => {
  return await provider?.request({
    method: 'eth_signTypedData_v4',
    params: [addr, message],
  });
};

export const isUTF8 = (str: string): boolean => {
  try {
    new TextDecoder('utf-8').decode(new TextEncoder().encode(str));
    return true;
  } catch {
    return false;
  }
};

export const toHex = (char = '') => {
  return char.charCodeAt(0).toString(16);
};

export const encodeToHex = (str = '') => {
  return str.split('').map(toHex).join('');
};

export const decodeFromHex = (hex = '') => {
  const result = [];
  for (let i = 0; i < hex.length; i += 2) {
    result.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
  }
  return result.join('');
};

export const hexToBytes = (hex = '') => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

export function uint8ArrayToJson(uint8Array: Uint8Array) {
  const decoder = new TextDecoder('utf-8');
  const jsonString = decoder.decode(uint8Array);
  return flatted.parse(jsonString);
}

export const decodeFromHexString = (hex = '') => {
  return uint8ArrayToJson(hexToBytes(hex));
};

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}

export function encodeBase64(data: Uint8Array, pad = true): string {
  const len = data.length;
  const extraBytes = len % 3;
  const parts = [];

  const len2 = len - extraBytes;
  for (let i = 0; i < len2; i += 3) {
    const tmp = ((data[i] << 16) & 0xff0000) + ((data[i + 1] << 8) & 0xff00) + (data[i + 2] & 0xff);

    const triplet =
      base64Chars.charAt((tmp >> 18) & 0x3f) +
      base64Chars.charAt((tmp >> 12) & 0x3f) +
      base64Chars.charAt((tmp >> 6) & 0x3f) +
      base64Chars.charAt(tmp & 0x3f);

    parts.push(triplet);
  }

  if (extraBytes === 1) {
    const tmp = data[len - 1];
    const a = base64Chars.charAt(tmp >> 2);
    const b = base64Chars.charAt((tmp << 4) & 0x3f);

    parts.push(`${a}${b}`);
    if (pad) {
      parts.push('==');
    }
  } else if (extraBytes === 2) {
    const tmp = (data[len - 2] << 8) + data[len - 1];
    const a = base64Chars.charAt(tmp >> 10);
    const b = base64Chars.charAt((tmp >> 4) & 0x3f);
    const c = base64Chars.charAt((tmp << 2) & 0x3f);
    parts.push(`${a}${b}${c}`);
    if (pad) {
      parts.push('=');
    }
  }

  return parts.join('');
}

export function getDecodeBase64Length(data: string): number {
  let bufferLength = Math.floor(data.length * 0.75);
  const len = data.length;

  if (data[len - 1] === '=') {
    bufferLength -= 1;
    if (data[len - 2] === '=') {
      bufferLength -= 1;
    }
  }

  return bufferLength;
}

export function decodeBase64(data: string): Uint8Array {
  const bufferLength = getDecodeBase64Length(data);
  const len = data.length;

  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = base64Lookup[data.charCodeAt(i)];
    const encoded2 = base64Lookup[data.charCodeAt(i + 1)];
    const encoded3 = base64Lookup[data.charCodeAt(i + 2)];
    const encoded4 = base64Lookup[data.charCodeAt(i + 3)];

    bytes[p] = (encoded1 << 2) | (encoded2 >> 4);
    p += 1;
    bytes[p] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    p += 1;
    bytes[p] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    p += 1;
  }

  return bytes;
}
