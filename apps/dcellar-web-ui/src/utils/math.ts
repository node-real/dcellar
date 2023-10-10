import BigNumber from 'bignumber.js';

BigNumber.config({
  EXPONENTIAL_AT: 18,
});

export const BN = BigNumber;
