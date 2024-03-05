import { get } from '@/base/http';
import { ErrorResponse, commonFault } from './error';

export type GetDailyBucketListByOwnerParams = {
  page: number;
  per_page: number;
  owner: string;
};

export type DailyBucketStorage = {
  BucketNumID: string;
  BucketID: string;
  BucketName: string;
  Owner: string;
  TotalTxCount: number;
  DailyTxCount: number;
  DailyTxCountList: number[];
  DailyTotalChargedStorageSize: string[];
};

export const getDailyBucketStorageListByOwner = (
  params: GetDailyBucketListByOwnerParams,
): Promise<[DailyBucketStorage[], null] | ErrorResponse> => {
  const url = `/api/chart/daily_bucket/list`;
  return get({ url, data: params }).then((res) => {
    return [res.result, null];
  }, commonFault);
};
