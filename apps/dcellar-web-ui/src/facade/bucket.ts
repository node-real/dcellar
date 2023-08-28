import {
  IQuotaProps,
} from '@bnb-chain/greenfield-js-sdk/dist/esm/types/storage';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import { QueryHeadBucketResponse } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import {
  broadcastFault,
  commonFault,
  createTxFault,
  ErrorResponse,
  offChainAuthFault,
  simulateFault,
} from '@/facade/error';
import { resolve } from '@/facade/common';
import { TBaseGetBucketReadQuota } from '@bnb-chain/greenfield-js-sdk/dist/cjs/types';
import { GetUserBucketsResponse, IObjectResultType, ISimulateGasFee } from '@bnb-chain/greenfield-js-sdk';
import { MsgUpdateBucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { Connector } from 'wagmi';
import { BroadcastResponse } from '@/facade/object';
import { signTypedDataCallback } from '@/facade/wallet';

export type TGetReadQuotaParams = {
  bucketName: string;
  endpoint: string;
  seedString: string;
  address: string;
};

export const quotaRemains = (quota: IQuotaProps, payload: string | number) => {
  const { freeQuota, readQuota, consumedQuota } = quota;
  return !BigNumber(freeQuota).plus(readQuota).minus(consumedQuota).minus(payload).isNegative();
};

export const headBucket = async (bucketName: string) => {
  const client = await getClient();
  const { bucketInfo } = await client.bucket
    .headBucket(bucketName)
    .catch(() => ({} as QueryHeadBucketResponse));
  return bucketInfo || null;
};

export const getUserBuckets = async (
  address: string,
  endpoint: string,
): Promise<ErrorResponse | [IObjectResultType<GetUserBucketsResponse>, null]> => {
  const client = await getClient();
  const [res, error] = await client.bucket
    .getUserBuckets({ address, endpoint })
    .then(resolve, commonFault);

  if (error) return [null, error];
  return [res!, null];
};

export const getBucketReadQuota = async ({
  bucketName,
  seedString,
  address,
}: TGetReadQuotaParams): Promise<ErrorResponse | [IQuotaProps, null]> => {
  const client = await getClient();
  const payload: TBaseGetBucketReadQuota = {
    bucketName,
  };
  const [res, error] = await client.bucket
    .getBucketReadQuota(payload, {
        type: 'EDDSA',
        seed: seedString,
        domain: window.location.origin,
        address,
    })
    .then(resolve, offChainAuthFault);
  if (error) return [null, error];

  const quota = res?.body as IQuotaProps;
  return [quota, null];
};

export const updateBucketInfo = async (
  msg: MsgUpdateBucketInfo,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();
  const [tx, error1] = await client.bucket.updateBucketInfo(msg).then(resolve, createTxFault);
  if (!tx) return [null, error1];

  const [simulate, error2] = await tx.simulate({ denom: 'BNB' }).then(resolve, simulateFault);
  if (!simulate) return [null, error2];

  const payload = {
    denom: 'BNB',
    gasLimit: Number(simulate.gasLimit),
    gasPrice: simulate.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return tx.broadcast(payload).then(resolve, broadcastFault);
};

export const preExecDeleteBucket = async (
  bucketName: string,
  address: string,
): Promise<ErrorResponse | [ISimulateGasFee, null]> => {
  const client = await getClient();
  const deleteBucketTx = await client.bucket.deleteBucket({
    bucketName,
    operator: address,
  });
  const [data, error] = await deleteBucketTx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);

  if (error) return [null, error];
  return [data!, null];
};
