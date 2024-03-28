import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';

import { ObjectActionValueType } from '@/modules/object/components/ObjectList';
import { UploadObject } from '@/store/slices/global';
import {
  AuthType,
  DelegatedPubObjectRequest,
  PutObjectRequest,
} from '@bnb-chain/greenfield-js-sdk';
import {
  makeDelegatePutObjectHeaders,
  makePutObjectHeaders,
} from '@/modules/object/utils/getPutObjectHeaders';
import { resolve } from '@/facade/common';
import { commonFault } from '@/facade/error';

export type TKey = keyof typeof VisibilityType;
export type TReverseVisibilityType = {
  [K in number]: TKey;
};

const StringIsNumber = (value: string) => !isNaN(Number(value));

export const formatLockFee = (lockFee: string | undefined) => {
  return String(Number(lockFee || '') / Math.pow(10, 18));
};

export const pickAction = (actions: ObjectActionValueType[], values: ObjectActionValueType[]) => {
  return actions.filter((item) => values.includes(item));
};

export const removeAction = (actions: ObjectActionValueType[], values: ObjectActionValueType[]) => {
  return actions.filter((item) => !values.includes(item));
};

export const getMockFile = (name: string, size = 2) => {
  const fileSizeInBytes = size;
  const data = new Uint8Array(fileSizeInBytes);
  for (let i = 0; i < fileSizeInBytes; i++) {
    data[i] = Math.floor(Math.random() * 256); // 随机生成数据
  }

  return new File([data], name, { type: 'text/plain' });
};

export const getPutObjectRequestConfig = async (
  task: UploadObject,
  loginAccount: string,
  seedString: string,
  endpoint: string,
  mockFile: File,
) => {
  const fullObjectName = [...task.prefixFolders, task.waitObject.relativePath, task.waitObject.name]
    .filter((item) => !!item)
    .join('/');
  const authType = {
    type: 'EDDSA',
    seed: seedString,
    domain: window.location.origin,
    address: loginAccount,
  } as AuthType;

  if (!task.delegateUpload) {
    const payload: PutObjectRequest = {
      bucketName: task.bucketName,
      objectName: fullObjectName,
      body: task.waitObject.file,
      txnHash: task.createHash,
    };

    return makePutObjectHeaders(payload, authType, endpoint).then(resolve, commonFault);
  }

  const payload: DelegatedPubObjectRequest = {
    bucketName: task.bucketName,
    objectName: fullObjectName,
    body: mockFile,
    delegatedOpts: {
      visibility: task.visibility,
    },
  };

  return makeDelegatePutObjectHeaders(payload, authType, endpoint).then(resolve, commonFault);
};
