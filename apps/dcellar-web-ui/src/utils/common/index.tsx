import BigNumber from "bignumber.js";
import { currencyFormatter } from "../currencyFormatter";
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from "@/modules/wallet/constants";

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