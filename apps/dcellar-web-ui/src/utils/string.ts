import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/storage';
import { formatBytes } from '@/modules/file/utils';

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

// encodeURIComponent() uses the same encoding algorithm as described in encodeURI(). It escapes all characters except:
// A–Z a–z 0–9 - _ . ! ~ * ' ( )
export const encodeObjectName = (pathName: string) => {
  const reservedNames = /^[a-zA-Z0-9-_.~/]+$/;
  if (reservedNames.test(pathName)) {
    return pathName;
  }

  let encodedPathName = '';
  for (let i = 0; i < pathName.length; i++) {
    const s = pathName[i];

    // soft characters
    if (('A' <= s && s <= 'Z') || ('a' <= s && s <= 'z') || ('0' <= s && s <= '9')) {
      encodedPathName += s;
      continue;
    }

    switch (s) {
      // special characters are allowed
      case '-':
      case '_':
      case '.':
      case '~':
      case '/':
        encodedPathName += s;
        continue;

      // others characters need to be encoded
      default:
        // . ! @ # $ % ^ & * ) ( - + = { } [ ] / " , ' < > ~ \ .` ? : ; | \\
        if (/[.!@#$%^&*)(\-+={}\[\]\/",'<>~·`?:;|\\]+$/.test(s)) {
          // english characters
          const hexStr = s.charCodeAt(0).toString(16);
          encodedPathName += '%' + hexStr.toUpperCase();
        } else {
          // others characters
          encodedPathName += encodeURI(s);
        }
    }
  }
  return encodedPathName;
};

export const decodeObjectName = (obj: string) => {
  return obj.split('/').map(decodeURIComponent).join('/');
};

export const formatId = (id: number) => {
  const hex = Number(id).toString(16).replace('0x', '');
  const value = `0x${hex.padStart(64, '0')}`;
  return value;
};

export const copy = (text: string) => {
  const range = document.createRange();
  const div = document.createElement('div');
  div.innerText = text;
  div.style.position = 'absolute';
  div.style.left = '-99999px';
  div.style.top = '-99999px';
  document.body.appendChild(div);
  range.selectNode(div);

  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy');
  range.detach();
  document.body.removeChild(div);
};

const getObjectPath = (bucketName = '', objectName = '') => {
  return [bucketName, encodeObjectName(objectName)].join('/');
};

export const getShareLink = (bucketName: string, objectName: string) => {
  return `${location.origin}/share?file=${encodeURIComponent(
    getObjectPath(bucketName, objectName),
  )}`;
};

export const formatQuota = (quota: IQuotaProps, removeSpace = true) => {
  const { freeQuota = 0, readQuota = 0, consumedQuota = 0, freeConsumedSize = 0 } = quota || {};

  const value = {
    totalFree: freeQuota + freeConsumedSize,
    totalRead: readQuota,
    remainFree: freeQuota,
    remainRead: readQuota - consumedQuota,
    total: readQuota + freeQuota + freeConsumedSize,
    remain: freeQuota + readQuota - consumedQuota,
  };

  const f = (v: number, _removeSpace = removeSpace) => {
    if (!quota) return '--';
    const text = _removeSpace ? formatBytes(v, true).replace(' ', '') : formatBytes(v, true);
    return v ? text : text.replace('B', 'GB');
  };

  const text = {
    totalFreeText: f(freeQuota + freeConsumedSize),
    totalReadText: f(readQuota),
    remainFreeText: f(freeQuota),
    remainReadText: f(readQuota - consumedQuota),
    totalText: f(readQuota + freeQuota + freeConsumedSize),
    remainText: f(freeQuota + readQuota - consumedQuota),
  };

  return {
    ...value,
    ...text,
    remainPercent: (value.remain / value.total) * 100,
    freeRemainPercent: (value.remainFree / value.total) * 100,
    readRemainPercent: (value.remainRead / value.total) * 100,
    show: `${f(value.remain, false)} / ${f(value.total, false)}`,
  };
};
