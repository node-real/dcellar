import { BILLING_API_URL } from '@/base/env'
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
}

export type GetMonthlyBillByOwnerResponse = { bills: RawMonthlyBill[] }[];

export type GetMonthlyBillByAddressResponse = RawMonthlyBill[];

export type GetRealTimeBillCountByAddressParams = {
  address: string;
  start?: number;
  end?: number;
}
export type GetRealTimeBillByAddressParams = GetRealTimeBillCountByAddressParams & {
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
}
export type GetRealTimeBillByAddressResponse = RawRealTimeBill[];
export type GetRealTimeBillByAddressCountParams = {
  address: string;
  start: number;
  end: number;
}
export type GetRealTimeBillByOwnerCountParams = {
  owner: string;
  payments?: string[];
  start?: number;
  end?: number;
}
export type GetRealTimeBillListByOwnerParams =  GetRealTimeBillByOwnerCountParams & {
  page: number;
  per_page: number;
};
export type GetRealTimeBillListByOwnerResponse = RawRealTimeBill[];
export const getTotalCostByOwner = (address: string): Promise<[RawAccountCost[], null] | ErrorResponse> => {
  const url = `${BILLING_API_URL}/greenfield/total_cost/list/by_owner/${address}`;
  return get({ url }).then((e) => {
    return [e.result, null];
  }, commonFault);
}
export const getTotalCostByAddress = (address: string): Promise<[RawAccountCost, null] | ErrorResponse> => {
  const url = `${BILLING_API_URL}/greenfield/total_cost/by_address/${address}`

  return get({ url }).then((e) => {
    return [e.result, null];
  }, commonFault);;
}

export const getMonthlyBillByOwner = (params: GetMonthlyBillByOwnerParams): Promise<ErrorResponse | [GetMonthlyBillByOwnerResponse, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_monthly/list/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getMonthlyBillByAddress = (params: GetMonthlyBillByAddressParams): Promise<ErrorResponse | [GetMonthlyBillByAddressResponse, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_monthly/list/by_address/${params.address}`

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillCountByAddress = (params: GetRealTimeBillCountByAddressParams): Promise<ErrorResponse | [number, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_realtime/count/by_address/${params.address}`

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillByAddress = (params: GetRealTimeBillByAddressParams): Promise<ErrorResponse | [GetRealTimeBillByAddressResponse, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_realtime/list/by_address/${params.address}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}


export const getRealTimeBillCountByOwner = (params: GetRealTimeBillByOwnerCountParams): Promise<ErrorResponse | [number, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_realtime/count/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}

export const getRealTimeBillListByOwner = (params: GetRealTimeBillListByOwnerParams): Promise<ErrorResponse | [GetRealTimeBillListByOwnerResponse, null]> => {
  const url = `${BILLING_API_URL}/greenfield/bill_realtime/list/by_owner/${params.owner}`;

  return get({ url, data: params }).then((e) => {
    return [e.result, null];
  }, commonFault);
}
