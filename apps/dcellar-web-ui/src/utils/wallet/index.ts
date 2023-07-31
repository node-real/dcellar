import Long from 'long';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';

const getShortenWalletAddress = (address: string) => {
  if (!address) return '';
  if (address.length <= 7) return address;
  const length = address.length;
  const prefix = address.substring(0, 6);
  const suffix = address.substring(length - 4, length);
  return `${prefix}...${suffix}`;
};

const generateBigNumberString = (bigNum: number) => {
  return bigNum.toLocaleString('fullwide', {
    useGrouping: false,
    maximumFractionDigits: 8,
  });
};

const getNumInDigits = (
  num: number | string | null,
  digits: number,
  fixDigits = false,
  isFloor = false,
) => {
  if (!num) num = 0;
  if (!digits) return num;
  const exponentNumber = Math.pow(10, digits);
  let numberString = '';
  if (isFloor) {
    numberString = generateBigNumberString(
      Math.floor(Number(num) * exponentNumber + Number.EPSILON) / exponentNumber,
    );
  } else {
    numberString = generateBigNumberString(
      Math.round(Number(num) * exponentNumber + Number.EPSILON) / exponentNumber,
    );
  }

  return fixDigits ? Number(numberString).toFixed(digits) : numberString;
};

const getLockFee = async (size = 0, primarySpAddress: string) => {
  try {
    const client = await getClient();
    const spStoragePrice = await client.sp.getStoragePriceByTime(primarySpAddress);
    const secondarySpStorePrice = await client.sp.getSecondarySpStorePrice();
    const { params } = await client.storage.params();
    const {
      minChargeSize = new Long(0),
      redundantDataChunkNum = 0,
      redundantParityChunkNum = 0,
    } = (params && params.versionedParams) || {};
    const { params: paymentParams } = await client.payment.params();
    const { reserveTime, validatorTaxRate = '' } = paymentParams?.versionedParams || {};
    const chargeSize = size >= minChargeSize.toNumber() ? size : minChargeSize.toString();
    const lockedFeeRate = BigNumber((spStoragePrice as any).storePrice)
      .plus(
        BigNumber((secondarySpStorePrice as any).storePrice).times(
          redundantDataChunkNum + redundantParityChunkNum,
        ),
      )
      .times(BigNumber(chargeSize))
      .times(BigNumber(validatorTaxRate))
      .dividedBy(Math.pow(10, 18));
    const lockFeeInBNB = lockedFeeRate
      .times(BigNumber(reserveTime?.toString() || 0))
      .dividedBy(Math.pow(10, 18));
    console.log('lockFeeInBNB', lockFeeInBNB.toString());
    return lockFeeInBNB.toString();
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Get lock fee error', error);
    throw new Error(error);
  }
};

export { getShortenWalletAddress, getNumInDigits, getLockFee };
