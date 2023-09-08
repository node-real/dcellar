import BigNumber from "bignumber.js";
import { currencyFormatter } from "../currencyFormatter";
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from "@/modules/wallet/constants";
import { Timestamp } from "@bnb-chain/greenfield-cosmos-types/google/protobuf/timestamp";

export const parseErrorXml = async (result: Response) => {
  try {
    const xmlText = await result.text();
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
  const amountFormat = BigNumber(amount || 0).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
  const fiatValue = currencyFormatter(BigNumber(amount).times(BigNumber(usdPrice)).toString());

  return `${amountFormat} ${symbol} (${fiatValue})`
}

export const displayTime = (intervalTime: number | string) => {
  const time = +intervalTime;
  const dayInSeconds = 24 * 60 * 60;
  const monthInSeconds = 30 * dayInSeconds;
  const timeObj = {
    monthInSeconds,
    dayInSeconds
  };

  let display = '';
  Object.entries(timeObj).forEach(([key, value]) => {
    const interval = Math.floor(time/value);
    if (interval >= 1) {
      display += interval + " " + key.replace('InSeconds', '') + ( interval > 1 ? 's' : '')
    }
  });

  return display
}
