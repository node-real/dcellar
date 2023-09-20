import BigNumber from 'bignumber.js';
import { currencyFormatter } from '../currencyFormatter';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { TRuntimeEnv } from '@/base/env';

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

export const renderFee = (amount: string | number, usdPrice: string | number, symbol = 'BNB') => {
  const amountFormat = BigNumber(amount || 0)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();
  const fiatValue = currencyFormatter(
    BigNumber(amount || 0)
      .times(BigNumber(usdPrice))
      .toString(),
  );

  return `${amountFormat} ${symbol} (${fiatValue})`;
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

  return display;
};

export const capitalizeFLetter = (str: string) => {
  return str.replace(/^./, str[0].toUpperCase());
};

export const networkTag = (runtimeEnv: TRuntimeEnv) => {
  return runtimeEnv === 'testnet' ? ` ${capitalizeFLetter(runtimeEnv)}` : '';
}