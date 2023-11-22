import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AppState } from '..';

interface DashboardState {
  filterBuckets: Record<string, string[]>
}
const initialState: DashboardState = {
  filterBuckets: {},
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialState,
  reducers: {
    setFilterBuckets(state, { payload }: PayloadAction<{ loginAccount: string, buckets: string[] }>) {
      const { loginAccount, buckets } = payload;
      state.filterBuckets[loginAccount] = buckets;
    },
  }
});

const defaultFilterBuckets: string[] = [];
export const selectFilterBuckets = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.dashboard.filterBuckets[loginAccount] || defaultFilterBuckets;
}
export const {
  setFilterBuckets
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
