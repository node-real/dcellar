import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import BigNumber from 'bignumber.js';

export const trimFloatZero = (str: string) => {
  const [intStr, floatStr] = str.split('.');

  if (floatStr) {
    const trimFloatStr = floatStr.replaceAll(/0+$/g, '');

    return trimFloatStr ? `${intStr}.${trimFloatStr}` : intStr;
  }

  return str;
};

export const removeTrailingSlash = (url: string) => {
  const regex = /\/+$/;
  return url.replace(regex, '');
};

export const isActivePath = (
  currentPath: string,
  path: string,
  basePath = '',
  enablePrefix = false,
) => {
  if (currentPath === '/') {
    return basePath ? path?.endsWith(basePath) : false;
  }
  if (enablePrefix) {
    return currentPath.includes(path);
  }

  return path?.endsWith(basePath + currentPath);
};

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

// todo emoji characters encoding
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
        // eslint-disable-next-line no-useless-escape
        if (/[.!@#$%^&*)(\-+={}\[\]\/",'<>~·`?:;|\\]+$/.test(s)) {
          // english characters
          const hexStr = s.charCodeAt(0).toString(16);
          encodedPathName += '%' + hexStr.toUpperCase();
        } else {
          // others characters
          try {
            encodedPathName += encodeURI(s);
          } catch (e) {
            encodedPathName += s;
          }
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
  return `0x${hex.padStart(64, '0')}`;
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

export const formatByGB = (num: number) => {
  return `${BigNumber(num).div(1_073_741_824).dp(2)} GB`;
};

export const formatQuota = (quota: IQuotaProps, removeSpace = true) => {
  const {
    freeQuota = 0,
    readQuota = 0,
    consumedQuota = 0,
    freeConsumedSize = 0,
    monthlyFreeQuota,
    monthlyQuotaConsumedSize,
  } = quota || {};

  const value = {
    totalFree: freeQuota + freeConsumedSize + monthlyFreeQuota,
    totalRead: readQuota,
    remainFree: freeQuota + monthlyFreeQuota - monthlyQuotaConsumedSize,
    remainRead: readQuota - consumedQuota,
    total: readQuota + freeQuota + freeConsumedSize + monthlyFreeQuota,
    remain: freeQuota + readQuota - consumedQuota + monthlyFreeQuota - monthlyQuotaConsumedSize,
    monthlyFreeQuota,
    monthlyQuotaConsumedSize,
    monthlyQuotaRemain: monthlyFreeQuota - monthlyQuotaConsumedSize,
    oneTimeFree: freeQuota + freeConsumedSize,
    oneTimeFreeConsumedSize: freeConsumedSize,
    oneTimeFreeRemain: freeQuota,
  };

  const f = (v: number, _removeSpace = removeSpace) => {
    if (!quota) return '--';
    if (v <= 0) return '0GB';
    const text = _removeSpace ? formatByGB(v).replace(' ', '') : formatByGB(v);
    return v ? text : text.replace('B', 'GB');
  };

  const text = {
    totalFreeText: f(value.totalFree),
    totalReadText: f(readQuota),
    remainFreeText: f(value.remainFree),
    remainReadText: f(readQuota - consumedQuota),
    totalText: f(value.total),
    remainText: f(value.remain),
    monthlyFreeQuotaText: f(monthlyFreeQuota),
    monthlyQuotaConsumedSizeText: f(monthlyQuotaConsumedSize),
    monthlyQuotaRemainText: f(value.monthlyQuotaRemain),
    oneTimeFreeText: f(value.oneTimeFree),
    oneTimeFreeConsumedSizeText: f(value.oneTimeFreeConsumedSize),
    oneTimeFreeRemainText: f(value.oneTimeFreeRemain),
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

export const parseError = (errorMessage: string) => {
  const regex = /\((\d+)\):\s+([^:]+):/;

  const match = errorMessage.match(regex);

  return {
    isError: !match,
    code: (match && match[1]) || -1,
    message: (match && match[2]) || '',
  };
};

export const formatAddress = (address: string) => {
  const prefix = address.slice(0, 15);
  const suffix = address.slice(-13);
  const middle = '...';

  return `${prefix}${middle}${suffix}`;
};

export const apolloUrlTemplate = (url: string, query: string) => {
  const template = new RegExp('__QUERY__', 'i');
  if (url.match(template)) {
    return url.replace(template, query);
  }
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
};
