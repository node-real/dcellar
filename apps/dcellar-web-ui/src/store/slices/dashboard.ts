import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '..';
import { DailyBucketStorage, getDailyBucketStorageListByOwner } from '@/facade/explorer';

interface DashboardState {
  filterBuckets: Record<string, string[]>;
  bucketDailyStorage: Record<string, DailyBucketStorage[]>;
}
const initialState: DashboardState = {
  filterBuckets: {},
  bucketDailyStorage: {},
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialState,
  reducers: {
    setFilterBuckets(state, { payload }: PayloadAction<{ loginAccount: string, buckets: string[] }>) {
      const { loginAccount, buckets } = payload;
      state.filterBuckets[loginAccount] = buckets;
    },
    setBucketDailyStorage(state, { payload }: PayloadAction<{ loginAccount: string, bucketDailyStorage: DailyBucketStorage[] }>) {
      const { loginAccount, bucketDailyStorage } = payload;
      state.bucketDailyStorage[loginAccount] = bucketDailyStorage;
    }
  }
});

const defaultFilterBuckets: string[] = [];
export const selectFilterBuckets = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.filterBuckets[loginAccount] || defaultFilterBuckets;
};

const defaultBucketDailyStorage = [] as DailyBucketStorage[];
export const selectBucketDailyStorage = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.bucketDailyStorage[loginAccount] || defaultBucketDailyStorage;
}

export const setupBucketDailyStorage = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const params = {
    page: 1,
    per_page: 201,
    owner: loginAccount
  };
  const [data, error] = await getDailyBucketStorageListByOwner(params);
  if (error || data === null) {
    return dispatch(setBucketDailyStorage({loginAccount, bucketDailyStorage: []}))
  }

  dispatch(setBucketDailyStorage({ loginAccount, bucketDailyStorage: data }));
}

export const {
  setFilterBuckets,
  setBucketDailyStorage,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
