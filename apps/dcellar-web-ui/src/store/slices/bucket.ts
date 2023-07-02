import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getUserBuckets } from '@/facade/bucket';
import { toast } from '@totejs/uikit';
import { BucketProps } from '@bnb-chain/greenfield-chain-sdk/dist/cjs/types';
import { omit } from 'lodash-es';

export type BucketItem = Omit<BucketProps, 'bucket_info'> & {
  bucket_name: string;
  create_at: number;
  bucket_status: number;
};

export interface BucketState {
  bucketInfo: Record<string, BucketProps['bucket_info']>;
  buckets: Record<string, BucketItem[]>;
  loading: boolean;
  currentPage: number;
}

const initialState: BucketState = {
  buckets: {},
  bucketInfo: {},
  loading: true,
  currentPage: 0,
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {
    setCurrentBucketPage(state, { payload }: PayloadAction<number>) {
      state.currentPage = payload;
    },
    setLoading(state, { payload }: PayloadAction<boolean>) {
      state.loading = payload;
    },
    setBucketList(state, { payload }: PayloadAction<{ address: string; buckets: BucketProps[] }>) {
      const { address, buckets } = payload;
      const all = buckets
        .map((bucket) => {
          const { bucket_name, create_at, bucket_status } = bucket.bucket_info;
          state.bucketInfo[bucket_name] = bucket.bucket_info;
          return {
            ...omit(bucket, 'bucket_info'),
            bucket_name,
            create_at: Number(create_at),
            bucket_status,
          };
        })
        .sort((a, b) => b.create_at - a.create_at);
      state.buckets[address] = all.filter((u) => !u.removed);
    },
  },
});

const defaultBucketList = Array<BucketItem>();
export const selectBucketList = (address: string) => (root: AppState) => {
  return root.bucket.buckets[address] || defaultBucketList;
};

export const selectHasDiscontinue = (address: string) => (root: AppState) =>
  (root.bucket.buckets[address] || defaultBucketList).some((i) => i.bucket_status === 1);

export const setupBuckets =
  (address: string, forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { oneSp, spInfo } = getState().sp;
    const { buckets } = getState().bucket;
    const sp = spInfo[oneSp];
    const { seedString } = await dispatch(getSpOffChainData(address, oneSp));
    if (!(address in buckets) || forceLoading) {
      dispatch(setLoading(true));
    }
    const [res, error] = await getUserBuckets(address, sp.endpoint, seedString);
    dispatch(setLoading(false));
    if (error || !res || res.code !== 0) {
      toast.error({ description: error || res?.message });
      return;
    }
    dispatch(setBucketList({ address, buckets: res.body || [] }));
  };

export const { setBucketList, setLoading, setCurrentBucketPage } = bucketSlice.actions;

export default bucketSlice.reducer;
