import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';

import { ObjectActionValueType } from '@/modules/object/components/ObjectList';
import { UploadObject, WaitObject } from '@/store/slices/global';
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
import { commonFault, E_OBJECT_NAME_EXISTS, E_UNKNOWN } from '@/facade/error';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { DELEGATE_UPLOAD } from '@/store/slices/object';

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
  file: File,
  sealed: boolean,
  fullObjectName: string,
) => {
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
    body: file,
    delegatedOpts: {
      isUpdate: task.waitObject.isUpdate && sealed,
      visibility: task.visibility,
    },
  };

  return makeDelegatePutObjectHeaders(payload, authType, endpoint).then(resolve, commonFault);
};

export const getObjectErrorMsg = (type: string) => {
  return OBJECT_ERROR_TYPES[type as ObjectErrorType]
    ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
    : OBJECT_ERROR_TYPES[E_UNKNOWN];
};

export const isUploadObjectUpdate = (item: WaitObject) => {
  return (
    item.msg === getObjectErrorMsg(E_OBJECT_NAME_EXISTS).title && DELEGATE_UPLOAD && item.isUpdate
  );
};

export const waitUploadFilterFn = (item: WaitObject) => {
  return item.status === 'WAIT' || isUploadObjectUpdate(item);
};

export const errorUploadFilterFn = (item: WaitObject) => {
  return item.status === 'ERROR' && !isUploadObjectUpdate(item);
};
