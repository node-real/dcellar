import { get } from '@/base/http';
import { ErrorResponse, commonFault } from './error';

export type RawAccountCost = {
  Address: string,
  Cost: string;
}
export type GetMonthlyBillByOwnerParams = {
  owner: string;
  start_year: number | string;
  start_month: number | string;
  end_year: number | string;
  end_month: number | string;
}
export type GetMonthlyBillByAddressParams = {
  address: string;
  start_year: number | string;
  start_month: number | string;
  end_year: number | string;
  end_month: number | string;
}
export type RawMonthlyBill = {
  Address: string;
  Year: number;
  Month: number;
  ReadCost: string;
  StoreCost: string;
  TotalCost: string;
  TxType: string;
  TxHash: string;
}

export type GetMonthlyBillByOwnerResponse = { bills: RawMonthlyBill[] }[];

export type GetMonthlyBillByAddressResponse = RawMonthlyBill[];

export type GetRealTimeBillCountByAddressParams = {
  address: string;
  start?: number;
  end?: number;
  types?: string[];
}
export type GetRealTimeBillListByAddressParams = GetRealTimeBillCountByAddressParams & {
  page: number;
  per_page: number;
};

export type RawRealTimeBill = {
  Address: string;
  Timestamp: string;
  ReadCost: string;
  StoreCost: string;
  TotalCost: string;
  Balance: string;
  TxHash: string;
  TxType: string;
}
export type GetRealTimeBillListByAddressResponse = RawRealTimeBill[];
export type GetRealTimeBillByAddressCountParams = {
  address: string;
  start?: number;
  end?: number;
  types?: string[];
}
export type GetRealTimeBillByOwnerCountParams = {
  owner: string;
  payments?: string[];
  start?: number;
  end?: number;
  types?: string[];
}
export type GetRealTimeBillListByOwnerParams =  GetRealTimeBillByOwnerCountParams & {
  page: number;
  per_page: number;
};
export type GetRealTimeBillListByOwnerResponse = RawRealTimeBill[];
export const getTotalCostByOwner = (address: string): Promise<[RawAccountCost[], null] | ErrorResponse> => {
  const url = `/api/total_cost/list/by_owner/${address}`;
  return get({ url }).then((e) => {
    return [e.result, null];
  }, commonFault);
}
export const getTotalCostByAddress = (address: string): Promise<[RawAccountCost, null] | ErrorResponse> => {
  const url = `/api/total_cost/list/by_address/${address}`

  return get({ url }).then((e) => {
    return [e.result, null];
  }, commonFault);;
}

export const getMonthlyBillByOwner = (params: GetMonthlyBillByOwnerParams): Promise<ErrorResponse | [GetMonthlyBillByOwnerResponse, null]> => {
  const url = `/api/bill_monthly/list/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getMonthlyBillByAddress = (params: GetMonthlyBillByAddressParams): Promise<ErrorResponse | [GetMonthlyBillByAddressResponse, null]> => {
  const url = `/api/bill_monthly/list/by_address/${params.address}`

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillCountByAddress = (params: GetRealTimeBillCountByAddressParams): Promise<ErrorResponse | [number, null]> => {
  const url = `/api/bill_realtime/count/by_address/${params.address}`

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillByAddress = (params: GetRealTimeBillListByAddressParams): Promise<ErrorResponse | [GetRealTimeBillListByAddressResponse, null]> => {
  const url = `/api/bill_realtime/list/by_address/${params.address}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}


export const getRealTimeBillCountByOwner = (params: GetRealTimeBillByOwnerCountParams): Promise<ErrorResponse | [number, null]> => {
  const url = `/api/bill_realtime/count/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillListByOwner = (params: GetRealTimeBillListByOwnerParams): Promise<ErrorResponse | [GetRealTimeBillListByOwnerResponse, null]> => {
  const url = `/api/bill_realtime/list/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}
