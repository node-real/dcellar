import { IObjectProps, IObjectResultType, TxResponse } from '@bnb-chain/greenfield-chain-sdk';
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
  simulateFault,
} from '@/facade/error';
import { getObjectInfoAndBucketQuota, resolve } from '@/facade/common';
import { MsgUpdateObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
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
import { AxiosResponse } from 'axios';
import { SpItem } from '@/store/slices/sp';
import { getDomain } from '@/utils/getDomain';
import { QueryHeadObjectResponse, QueryLockFeeRequest } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/query';
import { signTypedDataV4 } from '@/utils/signDataV4';

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
): Promise<[boolean, ErrorMsg?]> => {
  const [info, quota] = await getObjectInfoAndBucketQuota(bucketName, objectName, endpoint);
  if (!info) return [false, E_NOT_FOUND];

  const size = info.payloadSize.toString();
  if (info.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE && loginAccount !== info.owner)
    return [false, E_PERMISSION_DENIED];

  if (!quota) return [false, E_UNKNOWN];
  if (!quotaRemains(quota, size)) return [false, E_NO_QUOTA];
  return [true];
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
  debugger;
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
  objects: IObjectProps[];
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
  params: ListObjectsParams,
): Promise<[IObjectResultType<IObjectList>, null] | ErrorResponse> => {
  const domain = getDomain();
  const client = await getClient();
  const payload = { domain, ...params };
  const [list, error] = (await client.object
    .listObjects(payload)
    .then(resolve, commonFault)) as any;
  if (error) return [null, error];
  return [list! as IObjectResultType<IObjectList>, null];
};

export const getShareLink = (bucketName: string, objectName: string) => {
  const params = [bucketName, objectName || ''].join('/');

  return `${location.origin}/share?file=${encodeURIComponent(params)}`;
}

export const getDirectDownloadLink = ({primarySpEndpoint, bucketName, objectName
}: { primarySpEndpoint: string; bucketName: string; objectName: string}) => {
  return encodeURI(
    `${primarySpEndpoint}/download/${bucketName}/${encodeObjectName(objectName)}`,
  );
}

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
  return await client.storage.queryLockFee(params).then(resolve, commonFault);
}

export const headObject = async (bucketName: string, objectName: string) => {
  const client = await getClient();
  const { objectInfo } = await client.object
    .headObject(bucketName, objectName)
    .catch(() => ({} as QueryHeadObjectResponse));
  return objectInfo || null;
};
