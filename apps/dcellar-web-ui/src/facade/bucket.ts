import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import {
  QueryHeadBucketResponse,
  QueryQuoteUpdateTimeResponse,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import {
  broadcastFault,
  commonFault,
  createTxFault,
  ErrorResponse,
  offChainAuthFault,
  simulateFault,
} from '@/facade/error';
import { resolve } from '@/facade/common';
import {
  IQuotaProps,
  ISimulateGasFee,
  Long,
  ReadQuotaRequest,
  SpResponse,
} from '@bnb-chain/greenfield-js-sdk';
import { MsgUpdateBucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { Connector } from 'wagmi';
import { BroadcastResponse } from '@/facade/object';
import { signTypedDataCallback } from '@/facade/wallet';
import {
  BucketMetaWithVGF,
  PolicyMeta,
} from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { GetListObjectPoliciesResponse } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/ListObjectPolicies';
import { get } from 'lodash-es';
import { getTimestamp, getTimestampInSeconds } from '@/utils/time';

export type TGetReadQuotaParams = {
  bucketName: string;
  endpoint: string;
  seedString: string;
  address: string;
};

export const quotaRemains = (quota: IQuotaProps, payload: string | number) => {
  // free 剩余， readQuota, readConsumedQuota, freeConsumedSize
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
): Promise<ErrorResponse | [SpResponse<BucketMetaWithVGF[]>, null]> => {
  const client = await getClient();
  const [res, error] = await client.bucket
    .listBuckets({ address, endpoint })
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
  const payload: ReadQuotaRequest = {
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
  if (res?.code === -1) return [null, res?.message!];

  const quota = res?.body as IQuotaProps;
  return [quota, null];
};

export type UpdateBucketInfoPayload = Omit<MsgUpdateBucketInfo, 'chargedReadQuota'> & {
  chargedReadQuota?: string;
};

export const updateBucketInfo = async (
  msg: UpdateBucketInfoPayload,
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

export const getBucketExtraInfo = async (bucketName: string) => {
  const client = await getClient();
  return client.bucket.headBucketExtra(bucketName);
};

type DeleteBucketProps = {
  address: string;
  bucketName: string;
  connector: Connector;
};

export const deleteBucket = async ({
  address,
  bucketName,
  connector,
}: DeleteBucketProps): BroadcastResponse => {
  const client = await getClient();
  const [deleteBucketTx, error1] = await client.bucket
    .deleteBucket({
      bucketName: bucketName,
      operator: address,
    })
    .then(resolve, createTxFault);

  if (!deleteBucketTx) return [null, error1];

  const [simulateInfo, error2] = await deleteBucketTx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);

  if (!simulateInfo) return [null, error2];

  return deleteBucketTx
    .broadcast({
      denom: 'BNB',
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || '5000000000',
      payer: address,
      granter: '',
      signTypedDataCallback: signTypedDataCallback(connector),
    })
    .then(resolve, broadcastFault);
};

export const getObjectPolicies = async (bucketName: string, objectName: string) => {
  const client = await getClient();
  const res = (await client.object.listObjectPolicies({
    bucketName,
    objectName,
    limit: 1000,
    actionType: 'ACTION_GET_OBJECT',
  })) as { body: GetListObjectPoliciesResponse; code: number };
  const valuePath = 'body.GfSpListObjectPoliciesResponse.Policies';
  const list: PolicyMeta[] = get(res, valuePath);
  return list;
};

export const getBucketQuotaUpdateTime = async (bucketName: string) => {
  const client = await getClient();
  const storageClient = await client.queryClient.getStorageQueryClient();
  const defaultValue = new Long(getTimestampInSeconds());
  const res = await storageClient
    .QueryQuotaUpdateTime({ bucketName })
    .catch((e) => ({ updateAt: defaultValue } as QueryQuoteUpdateTimeResponse));
  return Number(res?.updateAt || defaultValue);
};
