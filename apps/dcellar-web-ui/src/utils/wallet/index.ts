import { makeRpcClient } from '@bnb-chain/gnfd-js-sdk';
import { QueryClientImpl as spQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/query';
import { QueryClientImpl as storageQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { QueryClientImpl as paymentQueryClientImpl } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/query';
import Long from 'long';
import BigNumber from 'bignumber.js';

import { GRPC_URL } from '@/base/env';

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
    const rpcClient = await makeRpcClient(GRPC_URL);
    const spRpc = new spQueryClientImpl(rpcClient);
    const storageRpc = new storageQueryClientImpl(rpcClient);
    const paymentRpc = new paymentQueryClientImpl(rpcClient);
    const { spStoragePrice } = await spRpc.QueryGetSpStoragePriceByTime({
      spAddr: primarySpAddress,
      timestamp: Long.fromNumber(Date.now()),
    });
    const { secondarySpStorePrice } = await spRpc.QueryGetSecondarySpStorePriceByTime({
      timestamp: Long.fromNumber(Date.now()),
    });
    const { params } = await storageRpc.Params();
    const {
      minChargeSize = new Long(0),
      redundantDataChunkNum = 0,
      redundantParityChunkNum = 0,
    } = params?.versionedParams ?? {};
    const { params: paymentParams = {} } = await paymentRpc.Params();
    const { reserveTime } = paymentParams as any;
    const chargeSize = size >= minChargeSize.toNumber() ? size : minChargeSize.toString();
    const lockedFeeRate = BigNumber((spStoragePrice as any).storePrice)
      .plus(
        BigNumber((secondarySpStorePrice as any).storePrice).times(
          redundantDataChunkNum + redundantParityChunkNum,
        ),
      )
      .times(BigNumber(chargeSize))
      .dividedBy(Math.pow(10, 18));
    const lockFeeInBNB = lockedFeeRate
      .times(BigNumber(reserveTime.toString()))
      .dividedBy(Math.pow(10, 18));
    return lockFeeInBNB.toString();
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Get lock fee error', error);
    throw new Error(error);
  }
};

export { getShortenWalletAddress, getNumInDigits, getLockFee };
