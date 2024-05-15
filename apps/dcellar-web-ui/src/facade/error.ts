import { ErrorMsgMap } from '@/context/WalletConnectContext/error/error';
import { parseWCMessage } from '@/utils/common';

export type ErrorMsg = string;

export const E_GET_GAS_FEE_LACK_BALANCE_ERROR = `Insufficient balance for gas estimation.`;
export const E_UNKNOWN_ERROR = `Unknown error. Please try again later.`;
export const E_SP_PRICE_FAILED = `Get SP storage price failed.`;
export const E_USER_REJECT_STATUS_NUM = '4001';
export const E_NOT_FOUND = 'NOT_FOUND';
export const E_PERMISSION_DENIED = 'PERMISSION_DENIED';
export const E_NO_QUOTA = 'NO_QUOTA';
export const E_UNKNOWN = 'UNKNOWN';
export const E_OFF_CHAIN_AUTH = 'OFF_CHAIN_AUTH';
export const E_SP_NOT_FOUND = 'SP_NOT_FOUND';
export const E_GET_QUOTA_FAILED = 'GET_QUOTA_FAILED';
export const E_NOT_BROWSER = 'NOT_BROWSER';
export const E_REQUEST_PENDING_NUM = '-32002';
export const E_FILE_TOO_LARGE = 'OBJECT_TOO_LARGE';
export const E_FILE_IS_EMPTY = 'FILE_IS_EMPTY';
export const E_OBJECT_NAME_EMPTY = 'OBJECT_NAME_EMPTY';
export const E_OBJECT_NAME_TOO_LONG = 'OBJECT_NAME_TOO_LONG';
export const E_OBJECT_NAME_NOT_UTF8 = 'OBJECT_NAME_NOT_UTF8';
export const E_OBJECT_NAME_CONTAINS_SLASH = 'OBJECT_NAME_CONTAINS_SLASH';
export const E_CAL_OBJECT_HASH = 'CAL_OBJECT_HASH';
export const E_OBJECT_NAME_EXISTS = 'OBJECT_NAME_EXISTS';
export const E_OBJECT_NOT_EXISTS = 'No such object';
export const E_FOLDER_NAME_EXISTS = 'FOLDER_NAME_EXISTS';
export const E_FOLDER_NAME_TOO_LONG = 'FOLDER_NAME_TOO_LONG';
export const E_FULL_OBJECT_NAME_TOO_LONG = 'FULL_OBJECT_NAME_TOO_LONG';
export const E_MAX_FOLDER_DEPTH = 'MAX_FOLDER_DEPTH';
export const E_ACCOUNT_BALANCE_NOT_ENOUGH = 'ACCOUNT_BALANCE_NOT_ENOUGH';
export const E_NO_PERMISSION = 'NO_PERMISSION';
export const E_SP_STORAGE_PRICE_FAILED = 'SP_STORAGE_PRICE_FAILED';
export const E_BUCKET_FLOW_RATE_NOT_SET =
  'The payment account does not specify a flow rate for this bucket, hence it cannot be created. Please contact the payment account owner first to set the flow rate for your bucket.';
export const E_BUCKET_FLOW_RATE_LOW =
  "The flow rate exceeds the maximum value. Please remove some objects or contact the payment account's owner to increase the flow rate.";

export declare class BroadcastTxError extends Error {
  readonly code: number;
  readonly codespace: string;
  readonly log: string | undefined;

  constructor(code: number, codespace: string, log: string | undefined);
}

export type ErrorResponse = [null, ErrorMsg];

export const simulateFault = (e: any): ErrorResponse => {
  console.error('SimulateFault', e);
  if (
    e?.message.includes('static balance is not enough') ||
    e?.message.includes('balance not enough')
  ) {
    return [null, E_GET_GAS_FEE_LACK_BALANCE_ERROR];
  }
  if (e?.message.includes('No such object')) {
    return [null, E_OBJECT_NOT_EXISTS];
  }
  if (e?.message.includes('the flow rate limit is not set for the bucket')) {
    return [null, E_BUCKET_FLOW_RATE_NOT_SET];
  }
  if (
    e?.message.includes('is greater than the flow rate limit') ||
    e?.message.includes('payment account is not changed but the bucket is limited')
  ) {
    return [null, E_BUCKET_FLOW_RATE_LOW];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const broadcastFault = (e: BroadcastTxError): ErrorResponse => {
  const { code = '' } = e;
  if (String(code) === E_USER_REJECT_STATUS_NUM) {
    return [null, ErrorMsgMap[E_USER_REJECT_STATUS_NUM]];
  }
  if (e?.message.includes('the flow rate limit is not set for the bucket')) {
    return [null, 'E_BUCKET_FLOW_RATE_NOT_SET'];
  }
  if (
    e?.message.includes('is greater than the flow rate limit') ||
    e?.message.includes('payment account is not changed but the bucket is limited')
  ) {
    return [null, 'Flow rate exceeds limit'];
  }
  return [null, parseWCMessage(e?.message) || E_UNKNOWN_ERROR];
};

export const createTxFault = (e: any): ErrorResponse => {
  const { code = '', message } = e;
  console.error('CreateTxFault', e);
  // todo refactor
  if (
    (code === -1 &&
      (e as any).statusCode === 500 &&
      [
        'Get create object approval error.',
        'Get create bucket approval error.',
        'user public key is expired',
        'invalid signature',
        'bad signature',
      ].includes(message)) ||
    ((e as any).statusCode === 400 &&
      ['user public key is expired', 'invalid signature', 'bad signature'].includes(message))
  ) {
    return [null, E_OFF_CHAIN_AUTH];
  }
  if ((e as any).statusCode === 429) {
    return [null, 'SP not available. Try later.'];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const offChainAuthFault = (e: any): ErrorResponse => {
  if (e?.response?.status === 500) {
    return [null, E_OFF_CHAIN_AUTH];
  }
  if (e?.message) {
    return [null, e?.message];
  }

  return [null, ''];
};

export const commonFault = (e: any): ErrorResponse => {
  if (e?.message.includes('the flow rate limit is not set for the bucket')) {
    return [null, E_BUCKET_FLOW_RATE_NOT_SET];
  }
  if (
    e?.message.includes('is greater than the flow rate limit') ||
    e?.message.includes('payment account is not changed but the bucket is limited')
  ) {
    return [null, E_BUCKET_FLOW_RATE_LOW];
  }
  if (e?.message) {
    return [null, e?.message];
  }
  return [null, E_UNKNOWN_ERROR];
};

export const queryLockFeeFault = (e: any): ErrorResponse => {
  if (e?.message.includes('storage price')) {
    return [null, E_SP_PRICE_FAILED];
  }
  if (e?.message) {
    return [null, e?.message];
  }

  return [null, E_UNKNOWN_ERROR];
};
