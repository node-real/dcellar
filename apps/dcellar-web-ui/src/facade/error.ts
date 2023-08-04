import { ErrorMsgMap } from '@/context/WalletConnectContext/error/error';

export type ErrorMsg = string;

export const E_GET_GAS_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for gas simulation, please check.`;
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
export const E_ACCOUNT_BALANCE_NOT_ENOUGH = 'ACCOUNT_BALANCE_NOT_ENOUGH';
export const E_NO_PERMISSION = 'NO_PERMISSION';
export const E_SP_STORAGE_PRICE_FAILED = 'SP_STORAGE_PRICE_FAILED';
export declare class BroadcastTxError extends Error {
  readonly code: number;
  readonly codespace: string;
  readonly log: string | undefined;

  constructor(code: number, codespace: string, log: string | undefined);
}

export type ErrorResponse = [null, ErrorMsg];

export const simulateFault = (e: any): ErrorResponse => {
  console.error('SimulateFault', e);
  if (e?.message.includes('static balance is not enough')) {
    return [null, E_GET_GAS_FEE_LACK_BALANCE_ERROR];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const broadcastFault = (e: BroadcastTxError): ErrorResponse => {
  const { code = '' } = e;
  console.error('BroadcastFault', e);
  if (String(code) === E_USER_REJECT_STATUS_NUM) {
    return [null, ErrorMsgMap[E_USER_REJECT_STATUS_NUM]];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
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
      ].includes(message)) ||
    ((e as any).statusCode === 400 && ['user public key is expired', 'invalid signature'].includes(message))
  ) {
    return [null, E_OFF_CHAIN_AUTH];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const downloadPreviewFault = (e: any): ErrorResponse => {
  if (e?.response?.status === 500) {
    return [null, E_OFF_CHAIN_AUTH];
  }
  if (e?.response?.status === 401) {
    return [null, E_NO_PERMISSION];
  }
  if (e?.message) {
    return [null, e?.message];
  }

  return [null, E_UNKNOWN_ERROR];
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
  if (e?.message) {
    return [null, e?.message];
  }
  return [null, E_UNKNOWN_ERROR];
};

export const queryLockFeeFault = (e: any): ErrorResponse => {
  console.log('e', e);
  if (e?.message.includes('storage price')) {
    return [null, E_SP_PRICE_FAILED];
  }
  if (e?.message) {
    return [null, e?.message];
  }

  return [null, E_UNKNOWN_ERROR];
}
