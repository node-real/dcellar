import { parseError } from '../utils/parseError';
import { getClient } from '@/base/client';
import { TCreateBucket } from '@bnb-chain/greenfield-chain-sdk';
import { signTypedDataV4 } from '@/utils/signDataV4';

export const pollingCreateAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 1000) =>
  async (...args: T): Promise<any> => {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      try {
        const { bucketName } = args[0] as any;
        const result = (await fn(...args)) as any;
        if (result.code === 0) {
          const theNewBucket = (result.body || []).find(
            (item: any) => item.bucket_info.bucket_name === bucketName,
          );
          if (theNewBucket !== undefined) {
            return;
          }
          // continue
        } else {
          return;
        }

        // continue
      } catch (e: any) {
        const { code } = parseError(e?.message);
        if (+code !== 6) {
          throw e;
        }
        // continue
      }
    }
  };

export const pollingDeleteAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 1000) =>
  async (...args: T): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, interval));
    while (true) {
      try {
        const { bucketName } = args[0] as any;
        const result = (await fn(...args)) as any;
        if (result.code === 0) {
          const theNewBucket = (result.body || []).find(
            (item: any) => item.bucket_info.bucket_name === bucketName,
          );
          if (theNewBucket === undefined || theNewBucket.removed === true) {
            return;
          }
          // continue
        } else {
          return;
        }
        // continue
      } catch (e: any) {
        const { code, message } = parseError(e?.message);
        if (code === -1 && message === 'Address is empty, please check.') {
          return;
        } else {
          throw e;
        }
      }
    }
  };

export const getBucketInfo = async (bucketName: string): Promise<any> => {
  const client = await getClient();
  return await client.bucket.headBucket(bucketName);
};

export const getUserBuckets = async (params: {
  bucketName: string;
  address: string;
  endpoint: string;
}) => {
  const client = await getClient();
  return client.bucket.getUserBuckets(params);
};

// TODO This is a temp solution
export const pollingGetBucket = pollingCreateAsync(getUserBuckets, 500);
export const pollingDeleteBucket = pollingDeleteAsync(getUserBuckets, 500);

export const getDeleteBucketFee = async ({ bucketName, address }: any) => {
  const client = await getClient();
  const deleteBucketTx = await client.bucket.deleteBucket({
    bucketName: bucketName,
    operator: address,
  });
  const simulateInfo = await deleteBucketTx.simulate({
    denom: 'BNB',
  });

  return simulateInfo.gasFee;
};

export const genCreateBucketTx = async (configParam: TCreateBucket) => {
  const client = await getClient();
  const createBucketTx = await client.bucket.createBucket(configParam);

  return createBucketTx;
};

type DeleteBucketProps = {
  address: string;
  chain: any;
  bucketName: string;
  sp: any;
  provider: any;
};
export const deleteBucket = async ({ address, bucketName, sp, provider }: DeleteBucketProps) => {
  const client = await getClient();
  const deleteBucketTx = await client.bucket.deleteBucket({
    bucketName: bucketName,
    operator: address,
  });
  const simulateInfo = await deleteBucketTx.simulate({
    denom: 'BNB',
  });

  const txRes = await deleteBucketTx.broadcast({
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: async (addr: string, message: string) => {
      return await signTypedDataV4(provider, addr, message);
    },
  });

  // @ts-ignore
  await pollingDeleteBucket({ bucketName, address, endpoint: sp.endpoint });

  return txRes;
};

export const getSpStoragePriceByTime = async (spAddress: string) => {
  const client = await getClient();
  const res = await client.sp.getStoragePriceByTime(spAddress);

  return res;
};

export const bucketHasFile = async (fileList: any[]) => {
  return fileList.some((items) => items.removed === false);
};
