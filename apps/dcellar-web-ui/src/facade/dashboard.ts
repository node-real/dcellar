import { get } from '@/base/http';
import { ErrorResponse, commonFault } from './error';

export type GetBucketDailyUsageByOwnerParams = {
  page: number;
  per_page: number;
  owner: string;
};

export type BucketDailyStorageUsage = {
  BucketNumID: string;
  BucketID: string;
  BucketName: string;
  Owner: string;
  TotalTxCount: number;
  DailyTxCount: number;
  DailyTxCountList: number[];
  DailyTotalChargedStorageSize: string[];
};

export type BucketDailyQuotaUsage = {
  BucketID: string;
  BucketName: string;
  MonthlyQuotaSize: string;
  MonthlyQuotaConsumedSize: number;
  Date: number;
};

// key is bucketId
export type BucketDailyQuotaUsageResponse = Record<string, BucketDailyQuotaUsage[]>;

export const getBucketDailyStorageUsage = (
  params: GetBucketDailyUsageByOwnerParams,
): Promise<[BucketDailyStorageUsage[], null] | ErrorResponse> => {
  const url = `/api/chart/daily_bucket/list`;
  return get({ url, data: params }).then((res) => {
    return [res.result, null];
  }, commonFault);
};

export const getBucketDailyQuotaUsage = (
  params: GetBucketDailyUsageByOwnerParams,
): Promise<[BucketDailyQuotaUsageResponse, null] | ErrorResponse> => {
  const url = `/api/chart/daily_bucket_quota/list`;
  return get({ url, data: params }).then((res) => {
    return [res.result, null];
  }, commonFault);
};
