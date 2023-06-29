export type ErrorMsg = string;

export const E_GET_GAS_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for gas simulation, please check.`;
export const E_UNKNOWN_ERROR = `Unknown error. Please try again later.`;
export const E_USER_REJECT_STATUS_NUM = '4001';
export const E_NOT_FOUND = 'NOT_FOUND';
export const E_PERMISSION_DENIED = 'PERMISSION_DENIED';
export const E_NO_QUOTA = 'NO_QUOTA';
export const E_UNKNOWN = 'UNKNOWN';
export const E_OFF_CHAIN_AUTH = 'OFF_CHAIN_AUTH';
export const E_SP_NOT_FOUND = 'SP_NOT_FOUND';

export declare class BroadcastTxError extends Error {
  readonly code: number;
  readonly codespace: string;
  readonly log: string | undefined;

  constructor(code: number, codespace: string, log: string | undefined);
}

export type ErrorResponse = [null, ErrorMsg];

export const simulateFault = (e: any): ErrorResponse => {
  if (e?.message.includes('static balance is not enough')) {
    return [null, E_GET_GAS_FEE_LACK_BALANCE_ERROR];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const broadcastFault = (e: BroadcastTxError): ErrorResponse => {
  const { code = '' } = e;
  if (String(code) === E_USER_REJECT_STATUS_NUM) {
    return [null, E_USER_REJECT_STATUS_NUM];
  }
  return [null, e?.message || E_UNKNOWN_ERROR];
};

export const downloadPreviewFault = (e: any): ErrorResponse => {
  if (e?.response?.status === 500) {
    return [null, E_OFF_CHAIN_AUTH];
  }
  return [null, E_UNKNOWN_ERROR];
};

export const commonFault = (e: any): ErrorResponse => {
  if (e?.message) {
    return [null, e?.message];
  }
  return [null, E_UNKNOWN_ERROR];
};
