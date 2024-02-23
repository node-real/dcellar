import BigNumber from 'bignumber.js';

import { displayTokenSymbol } from '../wallet';

import { TRuntimeEnv } from '@/base/env';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { currencyFormatter } from '@/utils/formatter';

export const parseErrorXml = async (result: any) => {
  try {
    const xmlText = await result?.response?.data;
    const xml = await new window.DOMParser().parseFromString(xmlText, 'text/xml');
    const code = (xml as XMLDocument).getElementsByTagName('Code')[0].textContent;
    const message = (xml as XMLDocument).getElementsByTagName('Message')[0].textContent;
    return {
      code,
      message,
    };
  } catch {
    return {
      code: null,
      message: null,
    };
  }
};

export const renderFee = (amount: string | number, usdPrice: string | number) => {
  const TOKEN_SYMBOL = displayTokenSymbol();
  const amountFormat = BigNumber(amount || 0)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();
  const fiatValue = currencyFormatter(
    BigNumber(amount || 0)
      .times(BigNumber(usdPrice))
      .toString(),
  );

  return `${amountFormat} ${TOKEN_SYMBOL} (${fiatValue})`;
};

export const displayTime = (intervalTime: number | string) => {
  const time = +intervalTime;
  const dayInSeconds = 24 * 60 * 60;
  const monthInSeconds = 30 * dayInSeconds;
  const timeObj = {
    monthInSeconds,
    dayInSeconds,
  };

  let display = '';
  Object.entries(timeObj).forEach(([key, value]) => {
    const interval = Math.floor(time / value);
    if (interval >= 1) {
      display += interval + ' ' + key.replace('InSeconds', '') + (interval > 1 ? 's' : '');
    }
  });

  return display.replace(/(months?)(.*)/, '$1 ($2)');
};

export const capitalizeFLetter = (str: string) => {
  if (!str) return '';
  return str.replace(/^./, str[0].toUpperCase());
};

export const networkTag = (runtimeEnv: TRuntimeEnv) => {
  return ['mainnet', 'testnet'].includes(runtimeEnv) ? ` ${capitalizeFLetter(runtimeEnv)}` : '';
};

export function cssVar(name: string, type = 'colors') {
  return `var(--ui-${type}-${name.replaceAll('.', '-')})`;
}

export function scrollToId(id: string, top?: number) {
  const rect = document.getElementById(id)?.getBoundingClientRect();
  window.scrollTo({
    top: (rect?.top || 0) + document.documentElement.scrollTop - 65 - (top || 0),
    behavior: 'smooth',
  });
}

// The walletConnect Error is: `{code: xx, message: 'xxx'}
export function parseWCMessage(jsonStr: string) {
  try {
    return JSON.parse(jsonStr)?.message ?? jsonStr;
  } catch (e) {
    return jsonStr;
  }
}
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(''), ms));
}

export function convertObjectKey(
  obj: { [key: string]: any },
  type: 'lowercase' | 'uppercase',
): { [key: string]: any } {
  return Object.keys(obj).reduce((convertedObj: { [key: string]: any }, key: string) => {
    const newKey =
      type === 'lowercase' ? key.toLowerCase() : key.charAt(0).toUpperCase() + key.slice(1);
    convertedObj[newKey] = obj[key];
    return convertedObj;
  }, {});
}
