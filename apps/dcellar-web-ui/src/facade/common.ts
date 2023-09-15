import { getClient } from '@/base/client';
import { QueryHeadObjectResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { get } from '@/base/http';
import { commonFault, ErrorMsg } from '@/facade/error';
import { IQuotaProps, SpResponse } from '@bnb-chain/greenfield-js-sdk';

export const resolve = <R>(r: R): [R, null] => [r, null];

export const getObjectInfoAndBucketQuota = async ({
  bucketName,
  objectName,
  address,
  seedString,
  endpoint,
}: {
  bucketName: string;
  objectName: string;
  endpoint?: string;
  address: string;
  seedString: string;
}): Promise<[ObjectInfo | null, IQuotaProps | null, ErrorMsg?]> => {
  const client = await getClient();
  const [{ objectInfo }, { body, message }] = await Promise.all([
    client.object.headObject(bucketName, objectName).catch(() => ({} as QueryHeadObjectResponse)),
    client.bucket
      .getBucketReadQuota(
        {
          bucketName,
          endpoint,
        },
        {
          type: 'EDDSA',
          seed: seedString,
          domain: window.location.origin,
          address,
        },
      )
      .catch((e) => {
        return {} as SpResponse<IQuotaProps>;
      }),
  ]);

  return [objectInfo || null, body || null, message];
};

export type BnbPriceInfo = { price: string; symbol: string };

export const getDefaultBnbInfo = () => ({ price: '300', symbol: 'BNBUSDT' });

export const getBnbPrice = async (): Promise<BnbPriceInfo> => {
  const [res, error] = await get({
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT',
    customOptions: { needNotify: false },
  }).then(resolve, commonFault);

  if (error) return getDefaultBnbInfo();
  return res as BnbPriceInfo;
};
