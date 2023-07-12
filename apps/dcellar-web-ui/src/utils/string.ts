export const trimLongStr = (
  str: string,
  maxLength: number = 12,
  headLen: number = 6,
  footLen: number = 6,
) => {
  if (!str) {
    return '';
  }
  if (str.length > maxLength) {
    const head = str.substring(0, headLen);
    const foot = str.substring(str.length - footLen, str.length);
    return `${head}...${foot}`;
  }
  return str;
};

export const trimAddress = (
  address: string,
  maxLength: number = 12,
  headLen: number = 6,
  footLen: number = 6,
) => {
  return trimLongStr(formatAddress(address), maxLength, headLen, footLen);
};

export const formatAddress = (address = '') => {
  if (!address) return address;
  return isAddress(address) ? address : `0x${address}`;
};

export const isAddress = (address = '') => {
  return address.startsWith('0x');
};

export const encodeObjectName = (obj: string) => {
  return obj.split('/').map(encodeURIComponent).join('/');
};

export const decodeObjectName = (obj: string) => {
  return obj.split('/').map(decodeURIComponent).join('/');
};

export const formatId = (id: number) => {
  const hex = Number(id).toString(16).replace('0x', '');
  const value = `0x${hex.padStart(64, '0')}`;
  return value;
};
