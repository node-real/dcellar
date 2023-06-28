import { TxResponse } from '@bnb-chain/greenfield-chain-sdk';
import {
  broadcastFault,
  commonFault,
  downloadPreviewFault,
  E_NO_QUOTA,
  E_NOT_FOUND,
  E_OFF_CHAIN_AUTH,
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
import { IRawSPInfo } from '@/modules/buckets/type';
import { authDataValid } from '@/facade/auth';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { encodeObjectName } from '@/utils/string';
import {
  downloadWithProgress,
  saveFileByAxiosResponse,
  viewFileByAxiosResponse,
} from '@/modules/file/utils';
import { AxiosResponse } from 'axios';
import { getDomain } from '@/utils/getDomain';
import { getSpOffChainData } from '@/modules/off-chain-auth/utils';

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
  primarySp: IRawSPInfo;
  address: string;
};

export type GetObjectListParams = {
  bucketName: string;
  usedSpEndpoint: string;
  spEndpoint: string;
  address: string;
  primarySpAddress: string;
  folderName?: string;
}

export const getObjectList = async (params: GetObjectListParams) => {
  const { address, primarySpAddress, folderName, usedSpEndpoint, bucketName } = params;
  const [domain, domainError] = getDomain();
  if (!domain) return [null, domainError];
  const { seedString } = await getSpOffChainData({ address, spAddress: primarySpAddress });
  const query = new URLSearchParams();
  query.append('delimiter', '/');
  query.append('max-keys', '1000');
  if (folderName) {
    query.append('prefix', folderName);
  }
  const client = await getClient();

  const [result, error] = await client.object.listObjects({
    address,
    bucketName,
    endpoint: usedSpEndpoint,
    domain,
    seedString,
    query,
  }).then(resolve, commonFault);
  if (!result) return [null, error];

  const { objects = [], common_prefixes = [] } = result.body ?? ({} as any);
  const files = objects
    .filter((v: any) => !(v.removed || v.object_info.object_name === folderName))
    .map((v: any) => v.object_info)
    .sort(function (a: any, b: any) {
      return Number(b.create_at) - Number(a.create_at);
    });
  const folders = common_prefixes
    .sort((a: string, b: string) => a.localeCompare(b))
    .map((folder: string) => ({
      object_name: folder,
      object_status: 1,
    }));
  const items = folders.concat(files);

  return [items];
}


const getObjectBytes = async (
  params: DownloadPreviewParams,
): Promise<[AxiosResponse | null, ErrorMsg?]> => {
  const { address, primarySp, objectInfo } = params;
  const { bucketName, objectName, payloadSize } = objectInfo;
  // 下载之前做off chain auth 数据校验
  const valid = await authDataValid(address, primarySp.operatorAddress);
  if (!valid) return [null, E_OFF_CHAIN_AUTH];

  const [result, error] = await downloadWithProgress({
    bucketName,
    objectName,
    primarySp,
    payloadSize: payloadSize.toNumber(),
    address,
  }).then(resolve, downloadPreviewFault);
  if (!result) return [null, error];

  return [result];
};

export const downloadObject = async (
  params: DownloadPreviewParams,
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

  const [result, error] = await getObjectBytes(params);
  if (!result) return [false, error];

  saveFileByAxiosResponse(result, objectName);
  return [true];
};

export const previewObject = async (
  params: DownloadPreviewParams,
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

  const [result, error] = await getObjectBytes(params);
  if (!result) return [false, error];

  viewFileByAxiosResponse(result);
  return [true];
};
