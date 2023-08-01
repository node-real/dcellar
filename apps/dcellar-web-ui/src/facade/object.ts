import {
  IObjectResponse,
  IObjectResultType,
  TListObjects,
  IQuotaProps,
  TxResponse,
  ISimulateGasFee,
  generateUrlByBucketName,
} from '@bnb-chain/greenfield-chain-sdk';
import {
  broadcastFault,
  commonFault,
  downloadPreviewFault,
  E_NO_QUOTA,
  E_NOT_FOUND,
  E_PERMISSION_DENIED,
  E_UNKNOWN,
  ErrorMsg,
  ErrorResponse,
  queryLockFeeFault,
  simulateFault,
} from '@/facade/error';
import { getObjectInfoAndBucketQuota, resolve } from '@/facade/common';
import {
  MsgPutPolicy,
  MsgUpdateObjectInfo,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { Connector } from 'wagmi';
import { getClient } from '@/base/client';
import { signTypedDataCallback } from '@/facade/wallet';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { quotaRemains } from '@/facade/bucket';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { encodeObjectName } from '@/utils/string';
import {
  downloadWithProgress,
  saveFileByAxiosResponse,
  viewFileByAxiosResponse,
} from '@/modules/file/utils';
import axios, { AxiosResponse } from 'axios';
import { SpItem } from '@/store/slices/sp';
import { getDomain } from '@/utils/getDomain';
import {
  QueryHeadObjectResponse,
  QueryLockFeeRequest,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { signTypedDataV4 } from '@/utils/signDataV4';
import BigNumber from 'bignumber.js';

export type DeliverResponse = Awaited<ReturnType<TxResponse['broadcast']>>;

type BroadcastResponse = Promise<ErrorResponse | [DeliverResponse, null]>;

export const updateObjectInfo = async (
  msg: MsgUpdateObjectInfo,
  connector: Connector,
): BroadcastResponse => {
  const client = await getClient();
  const updateInfoTx = await client.object.updateObjectInfo(msg);

  const [simulateInfo, simulateError] = await updateInfoTx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];

  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: msg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };

  return updateInfoTx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const getCanObjectAccess = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
  loginAccount: string,
  seedString: string,
): Promise<[boolean, ErrorMsg?, ObjectInfo?, IQuotaProps?]> => {
  const params = {
    bucketName,
    objectName,
    endpoint,
    address: loginAccount,
    seedString,
  };
  const [info, quota] = await getObjectInfoAndBucketQuota(params);
  if (!info) return [false, E_NOT_FOUND];

  const size = info.payloadSize.toString();
  if (info.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE && loginAccount !== info.owner)
    return [false, E_PERMISSION_DENIED];

  if (!quota) return [false, E_UNKNOWN];
  if (!quotaRemains(quota, size)) return [false, E_NO_QUOTA];
  return [true, '', info, quota];
};

export type DownloadPreviewParams = {
  objectInfo: ObjectInfo;
  primarySp: SpItem;
  address: string;
};

const getObjectBytes = async (
  params: DownloadPreviewParams,
  seedString: string,
): Promise<[AxiosResponse | null, ErrorMsg?]> => {
  const { address, primarySp, objectInfo } = params;
  const { bucketName, objectName, payloadSize } = objectInfo;

  const [result, error] = await downloadWithProgress({
    bucketName,
    objectName,
    primarySp,
    payloadSize: payloadSize.toNumber(),
    address,
    seedString,
  }).then(resolve, downloadPreviewFault);
  if (!result) return [null, error];

  return [result];
};

export const downloadObject = async (
  params: DownloadPreviewParams,
  seedString: string,
): Promise<[boolean, ErrorMsg?]> => {
  const { primarySp, objectInfo } = params;
  const { endpoint } = primarySp;
  const { visibility, bucketName, objectName } = objectInfo;

  const isPrivate = visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
  const link = `${endpoint}/download/${bucketName}/${encodeObjectName(objectName)}`;
  if (!isPrivate) {
    window.location.href = link;
    return [true];
  }

  const [result, error] = await getObjectBytes(params, seedString);
  if (!result) return [false, error];

  saveFileByAxiosResponse(result, objectName);
  return [true];
};

export const previewObject = async (
  params: DownloadPreviewParams,
  seedString: string,
): Promise<[boolean, ErrorMsg?]> => {
  const { primarySp, objectInfo } = params;
  const { endpoint } = primarySp;
  const { visibility, bucketName, objectName } = objectInfo;

  const isPrivate = visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
  const link = `${endpoint}/view/${bucketName}/${encodeObjectName(objectName)}`;
  if (!isPrivate) {
    window.open(link, '_blank');
    return [true];
  }

  const [result, error] = await getObjectBytes(params, seedString);
  console.log('result', result);
  if (!result) return [false, error];

  viewFileByAxiosResponse(result);
  return [true];
};

export type ListObjectsParams = {
  address: string;
  bucketName: string;
  endpoint: string;
  seedString: string;
  query: URLSearchParams;
};

export type IObjectList = {
  objects: IObjectResponse[];
  key_count: string;
  max_keys: string;
  is_truncated: boolean;
  next_continuation_token: string;
  name: string;
  prefix: string;
  delimiter: string;
  common_prefixes: string[];
  continuation_token: number;
};

export const getListObjects = async (
  params: TListObjects,
): Promise<[IObjectResultType<IObjectList>, null] | ErrorResponse> => {
  const client = await getClient();
  const payload = params;
  const [list, error] = (await client.object
    .listObjects(payload)
    .then(resolve, commonFault)) as any;
  if (error) return [null, error];
  return [list! as IObjectResultType<IObjectList>, null];
};

export const deleteObject = async (params: any, Connector: any): Promise<any> => {
  const { bucketName, objectName, address } = params;
  const client = await getClient();
  const delObjTx = await client.object.deleteObject({
    bucketName,
    objectName,
    operator: address,
  });
  const [simulateInfo, simulateError] = await delObjTx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: async (addr: string, message: string) => {
      const provider = await Connector?.getProvider();
      return await signTypedDataV4(provider, addr, message);
    },
  };

  return await delObjTx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const cancelCreateObject = async (params: any, Connector: any): Promise<any> => {
  const { bucketName, objectName, address } = params;
  const client = await getClient();
  const cancelObjectTx = await client.object.cancelCreateObject({
    bucketName,
    objectName,
    operator: address,
  });
  const [simulateInfo, simulateError] = await cancelObjectTx
    .simulate({
      denom: 'BNB',
    })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: address,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(Connector),
  };

  return await cancelObjectTx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const queryLockFee = async (params: QueryLockFeeRequest) => {
  const client = await getClient();
  return await client.storage.queryLockFee(params).then(resolve, queryLockFeeFault);
};

export const headObject = async (bucketName: string, objectName: string) => {
  const client = await getClient();
  const { objectInfo } = await client.object
    .headObject(bucketName, objectName)
    .catch(() => ({} as QueryHeadObjectResponse));
  return objectInfo || null;
};

export const putObjectPolicy = async (
  connector: Connector,
  bucketName: string,
  objectName: string,
  srcMsg: Omit<MsgPutPolicy, 'resource' | 'expirationTime'>,
): BroadcastResponse => {
  const client = await getClient();
  const tx = await client.object.putObjectPolicy(bucketName, objectName, srcMsg);
  const [simulateInfo, simulateError] = await tx
    .simulate({ denom: 'BNB' })
    .then(resolve, simulateFault);
  if (simulateError) return [null, simulateError];
  const broadcastPayload = {
    denom: 'BNB',
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || '5000000000',
    payer: srcMsg.operator,
    granter: '',
    signTypedDataCallback: signTypedDataCallback(connector),
  };
  return tx.broadcast(broadcastPayload).then(resolve, broadcastFault);
};

export const preExecDeleteObject = async (
  bucketName: string,
  objectName: string,
  address: string,
): Promise<ErrorResponse | [ISimulateGasFee, null]> => {
  const client = await getClient();
  const deleteBucketTx = await client.object.deleteObject({
    bucketName,
    objectName,
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

export const getObjectMeta = async (bucketName: string, objectName: string, endpoint: string) => {
  const url = `${generateUrlByBucketName(endpoint, bucketName)}/${encodeObjectName(
    objectName,
  )}?object-meta`;

  const errorHandle = async () => {
    return axios.get(url).catch(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(errorHandle());
        }, 1000);
      });
    });
  };

  return axios.get(url).catch(errorHandle);
};
