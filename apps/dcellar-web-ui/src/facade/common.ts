import { getClient } from '@/base/client';
import { QueryHeadObjectResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { IObjectResultType } from '@bnb-chain/greenfield-js-sdk';
import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/storage';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { get } from '@/base/http';
import { commonFault } from '@/facade/error';
import { getDomain } from '@/utils/getDomain';
import { MsgData } from '@bnb-chain/greenfield-cosmos-types/cosmos/base/abci/v1beta1/abci';

export const resolve = <R>(r: R): [R, null] => [r, null];

export const getObjectInfoAndBucketQuota = async ({
  bucketName,
  objectName,
  endpoint,
  address,
  seedString,
}: {
  bucketName: string;
  objectName: string;
  endpoint: string;
  address: string;
  seedString: string;
}): Promise<[ObjectInfo | null, IQuotaProps | null]> => {
  const client = await getClient();
  const [{ objectInfo }, { body }] = await Promise.all([
    client.object.headObject(bucketName, objectName).catch(() => ({} as QueryHeadObjectResponse)),
    client.bucket
      .getBucketReadQuota({
        bucketName,
        endpoint,
        signType: 'offChainAuth',
        address,
        seedString,
        domain: getDomain(),
      })
      .catch((e) => {
        return {} as IObjectResultType<IQuotaProps>;
      }),
  ]);

  return [objectInfo || null, body || null];
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
