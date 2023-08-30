import { getClient } from '@/base/client';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { TPreLockFeeParams } from '@/store/slices/global';
import {
  IReturnOffChainAuthKeyPairAndUpload,
  getUtcZeroTimestamp,
} from '@bnb-chain/greenfield-js-sdk';
import { BigNumber } from 'bignumber.js';

const getStorageProviders = async () => {
  const client = await getClient();
  const sps = await client.sp.getStorageProviders();
  return sps.filter((sp) => sp.endpoint.startsWith('https'));
};

const getBucketInfo = async (bucketName: string): Promise<any> => {
  const client = await getClient();
  const result = await client.bucket.headBucket(bucketName);

  return result?.bucketInfo ?? {};
};

const getObjectInfo = async (bucketName: string, objectName: string): Promise<any> => {
  const client = await getClient();
  return await client.object.headObject(bucketName, objectName);
};

const filterAuthSps = ({ address, sps }: { address: string; sps: any[] }) => {
  const curTime = getUtcZeroTimestamp();
  const key = `${address}-${GREENFIELD_CHAIN_ID}`;
  const localData = localStorage.getItem(key);
  const parseLocalData = (localData && JSON.parse(localData)) || [];
  const compatibleOldData = Array.isArray(parseLocalData) ? parseLocalData : [parseLocalData];

  const offChainSps = compatibleOldData
    .filter((item: IReturnOffChainAuthKeyPairAndUpload) => {
      return item.expirationTime > curTime;
    })
    .map((item) => item.spAddresses)
    .flat();

  const filterSps = sps.filter((sp) => {
    return offChainSps.includes(sp.operatorAddress);
  });

  return filterSps;
};

export const calPreLockFee = ({
  size,
  preLockFeeObject,
}: {
  size: number;
  primarySpAddress: string;
  preLockFeeObject: TPreLockFeeParams;
}) => {
  const {
    spStorageStorePrice,
    secondarySpStorePrice,
    redundantDataChunkNum,
    redundantParityChunkNum,
    minChargeSize,
    reserveTime,
    validatorTaxRate,
  } = preLockFeeObject;
  const chargeSize = size >= minChargeSize ? size : minChargeSize;
  const primarySpRate = BigNumber(spStorageStorePrice)
    .dividedBy(Math.pow(10, 18))
    .times(BigNumber(chargeSize));
  const secondarySpNum = redundantDataChunkNum + redundantParityChunkNum;
  let secondarySpRate = BigNumber(secondarySpStorePrice)
    .dividedBy(Math.pow(10, 18))
    .times(BigNumber(chargeSize));
  secondarySpRate = secondarySpRate.times(secondarySpNum);
  const validatorTax = BigNumber(validatorTaxRate)
    .dividedBy(Math.pow(10, 18))
    .times(primarySpRate.plus(secondarySpRate));
  const rate = primarySpRate.plus(secondarySpRate).plus(validatorTax);
  const lockFeeInBNB = rate.times(BigNumber(reserveTime || 0)).dividedBy(Math.pow(10, 18));

  return lockFeeInBNB.toString();
};

const checkZkWasm = (attempts: number = 5): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    if (typeof window.eddsaSign === 'function') {
      resolve(true);
    } else if (attempts > 0) {
      setTimeout(() => {
        resolve(checkZkWasm(attempts - 1));
      }, 1000);
    } else {
      resolve(false);
    }
  });
};

export { getStorageProviders, getBucketInfo, getObjectInfo, filterAuthSps, checkZkWasm };
