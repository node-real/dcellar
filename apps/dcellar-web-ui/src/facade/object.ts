import { TxResponse } from '@bnb-chain/greenfield-chain-sdk';
import {
  broadcastFault,
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

const getObjectBytes = async (
  params: DownloadPreviewParams,
): Promise<[AxiosResponse | null, ErrorMsg?]> => {
  const { address, primarySp, objectInfo } = params;
  const { bucketName, objectName, payloadSize } = objectInfo;
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