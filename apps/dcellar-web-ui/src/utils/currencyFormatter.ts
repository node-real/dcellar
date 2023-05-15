import { FIAT_CURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';

const locale = 'en-US';
const currency = 'USD';
// https://stackoverflow.com/questions/68848954/how-to-format-a-big-number-represented-by-string-in-javascript-with-currency-a
export const currencyFormatter = (amount: string) => {
  if (amount === 'NaN') return '';

  const [mainString, decimalString] = amount.split('.');

  const decimalFormat = new Intl.NumberFormat(locale, {
    minimumFractionDigits: FIAT_CURRENCY_DISPLAY_PRECISION,
    maximumFractionDigits: FIAT_CURRENCY_DISPLAY_PRECISION,
  });
  const decimalFullString = `0.${decimalString}`;
  const decimalFullNumber = Number.parseFloat(decimalFullString);
  const decimalFullFinal = decimalFormat.format(decimalFullNumber);
  const decimalFinal = decimalFullFinal.slice(1);
  const mainFormat = new Intl.NumberFormat(locale, { minimumFractionDigits: 0 });
  let mainBigInt = BigInt(mainString);
  if (decimalFullFinal[0] === '1') mainBigInt += BigInt(1);
  const mainFinal = mainFormat.format(mainBigInt);

  const amountFinal = `${mainFinal}${decimalFinal}`;
  const currencyFormat = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  const template = currencyFormat.format(0);
  const result = template.replace('0', amountFinal);

  return result;
};
