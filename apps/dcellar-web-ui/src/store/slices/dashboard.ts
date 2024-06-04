import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '..';
import {
  BucketDailyStorageUsage,
  getBucketDailyStorageUsage,
  getBucketDailyQuotaUsage,
  BucketDailyQuotaUsage,
} from '@/facade/dashboard';

interface DashboardState {
  bucketFilterRecords: Record<string, string[]>;
  bucketQuotaUsageFilterRecords: Record<string, string[]>;
  bucketDailyStorageUsageRecords: Record<string, BucketDailyStorageUsage[]>;
  // The first key is loginAccount, the second key is bucketName
  bucketDailyQuotaUsageRecords: Record<string, Record<string, BucketDailyQuotaUsage[]>>;
}

const initialState: DashboardState = {
  bucketFilterRecords: {},
  bucketQuotaUsageFilterRecords: {},
  bucketDailyStorageUsageRecords: {},
  bucketDailyQuotaUsageRecords: {},
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialState,
  reducers: {
    setBucketFilter(
      state,
      { payload }: PayloadAction<{ loginAccount: string; bucketNames: string[] }>,
    ) {
      const { loginAccount, bucketNames } = payload;
      state.bucketFilterRecords[loginAccount] = bucketNames;
    },
    setBucketDailyQuotaFilter(
      state,
      { payload }: PayloadAction<{ loginAccount: string; bucketNames: string[] }>,
    ) {
      const { loginAccount, bucketNames } = payload;
      state.bucketQuotaUsageFilterRecords[loginAccount] = bucketNames;
    },
    setBucketDailyStorageUsage(
      state,
      {
        payload,
      }: PayloadAction<{ loginAccount: string; bucketDailyStorage: BucketDailyStorageUsage[] }>,
    ) {
      const { loginAccount, bucketDailyStorage } = payload;
      state.bucketDailyStorageUsageRecords[loginAccount] = bucketDailyStorage;
    },
    setBucketDailyQuotaUsage(
      state,
      {
        payload,
      }: PayloadAction<{
        loginAccount: string;
        bucketDailyQuotaUsage: Record<string, BucketDailyQuotaUsage[]>;
      }>,
    ) {
      const { loginAccount, bucketDailyQuotaUsage } = payload;
      state.bucketDailyQuotaUsageRecords[loginAccount] = bucketDailyQuotaUsage;
    },
  },
});

export const {
  setBucketFilter,
  setBucketDailyQuotaFilter,
  setBucketDailyStorageUsage,
  setBucketDailyQuotaUsage,
} = dashboardSlice.actions;

const defaultFilterBuckets: string[] = [];
export const selectFilterBuckets = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.bucketFilterRecords[loginAccount] || defaultFilterBuckets;
};

const defaultFilterQuotaUsageBuckets: string[] = [];
export const selectFilterQuotaUsageBuckets = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return (
    root.dashboard.bucketQuotaUsageFilterRecords[loginAccount] || defaultFilterQuotaUsageBuckets
  );
};

const defaultBucketDailyStorage = [] as BucketDailyStorageUsage[];
export const selectBucketDailyStorage = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.bucketDailyStorageUsageRecords[loginAccount] || defaultBucketDailyStorage;
};

const defaultBucketDailyQuota = [] as BucketDailyQuotaUsage[];
export const selectBucketDailyQuotaUsage = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.bucketDailyQuotaUsageRecords[loginAccount] || defaultBucketDailyQuota;
};

export const setupBucketDailyStorageUsage =
  () => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const params = { page: 1, per_page: 201, owner: loginAccount };
    const [data, error] = await getBucketDailyStorageUsage(params);

    if (error || data === null) {
      return dispatch(setBucketDailyStorageUsage({ loginAccount, bucketDailyStorage: [] }));
    }

    dispatch(setBucketDailyStorageUsage({ loginAccount, bucketDailyStorage: data }));
  };

export const setupBucketDailyQuotaUsage =
  () => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const params = { page: 1, per_page: 201, owner: loginAccount };
    const [data, error] = await getBucketDailyQuotaUsage(params);

    if (error || data === null) {
      return dispatch(setBucketDailyQuotaUsage({ loginAccount, bucketDailyQuotaUsage: {} }));
    }
    const formatData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (!data[key]) {
          return acc;
        }
        const bucketName = data[key][0].BucketName;
        if (!acc[bucketName]) {
          acc[bucketName] = [];
        }
        acc[bucketName] = value;
        return acc;
      },
      {} as Record<string, BucketDailyQuotaUsage[]>,
    );

    dispatch(setBucketDailyQuotaUsage({ loginAccount, bucketDailyQuotaUsage: formatData }));
  };

export default dashboardSlice.reducer;
