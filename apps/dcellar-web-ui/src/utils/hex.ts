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

export { encodeToHex, decodeFromHex };
