const toHex = (char = '') => {
  return char.charCodeAt(0).toString(16);
};

const encodeToHex = (str = '') => {
  return str.split('').map(toHex).join('');
};

const decodeFromHex = (hex = '') => {
  const result = [];
  for (let i = 0; i < hex.length; i += 2) {
    result.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
  }
  return result.join('');
};

const hexToBytes = (hex = '') => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

function uint8ArrayToJson(uint8Array: Uint8Array) {
  const decoder = new TextDecoder('utf-8');
  const jsonString = decoder.decode(uint8Array);
  return JSON.parse(jsonString);
}

const decodeFromHexString = (hex = '') => {
  return uint8ArrayToJson(hexToBytes(hex));
};

export { encodeToHex, decodeFromHex, hexToBytes, uint8ArrayToJson, decodeFromHexString };
