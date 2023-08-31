import { parseError } from '../utils/parseError';
import { getClient } from '@/base/client';
import { GetUserBucketsResponse, IBaseGetCreateBucket, MsgDeleteBucketTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { signTypedDataV4 } from '@/utils/signDataV4';
import axios from 'axios';
import { TGasList } from '@/store/slices/global';
import { XMLParser } from 'fast-xml-parser';
import { AuthType } from '@bnb-chain/greenfield-js-sdk/dist/esm/clients/spclient/spClient';

export const pollingCreateAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 1000) =>
    async (...args: T): Promise<any> => {
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        try {
          const result = (await fn(...args)) as any;
          const xmlParser = new XMLParser({
            isArray: (tagName: string) => {
              if (tagName === 'Buckets') return true;
              return false;
            },
            numberParseOptions: {
              hex: false,
              leadingZeros: true,
              skipLike: undefined,
              eNotation: false,
            },
          });
          const xmlData = await result.data;
          const data = xmlParser.parse(xmlData) as GetUserBucketsResponse['GfSpGetUserBucketsResponse']['Buckets'][0];
          if (data) {
            const newBucketInfo = data.BucketInfo;
            if (newBucketInfo?.BucketName === args[0].BucketName) {
              return;
            }
          }
        } catch (e: any) {
          const { code } = parseError(e?.message);
          if (+code !== 6) {
            throw e;
          }
        }
      }
    };

export const pollingDeleteAsync =
  <T extends any[], U extends any>(fn: (...args: T) => Promise<U>, interval = 1000) =>
    async (...args: T): Promise<any> => {
      await new Promise((resolve) => setTimeout(resolve, interval));

      while (true) {
        try {
          const res = (await fn(...args)) as any;

          if (res.response.status === 500 || res.response.status === 404) {
            return;
          }
        } catch (e: any) {
          if (e?.response?.status === 500 || e?.response?.status === 404) {
            return;
          }
          const { code } = parseError(e?.response.message);
          if (+code !== 6) {
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
export const getBucketMeta = async (params: {
  bucketName: string;
  address: string;
  endpoint: string;
}) => {
  const { bucketName, endpoint } = params;
  const url = `${endpoint}/${bucketName}?bucket-meta`;

  return axios.get(url);
};
// TODO This is a temp solution
export const pollingGetBucket = pollingCreateAsync(getBucketMeta, 500);

export const pollingDeleteBucket = pollingDeleteAsync(getBucketMeta, 500);

export const getDeleteBucketFee = async (gasList: TGasList) => {
  return String(gasList[MsgDeleteBucketTypeUrl]?.gasFee ?? 0);
};

export const genCreateBucketTx = async (configParam: IBaseGetCreateBucket, authType: AuthType) => {
  const client = await getClient();
  const createBucketTx = await client.bucket.createBucket(configParam, authType);

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

  await pollingDeleteBucket({ bucketName, address, endpoint: sp.endpoint });

  return txRes;
};

export const bucketHasFile = async (fileList: any[]) => {
  return fileList.some((items) => items.removed === false);
};
