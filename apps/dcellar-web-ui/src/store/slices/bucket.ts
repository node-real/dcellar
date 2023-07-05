import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getBucketReadQuota, getUserBuckets, headBucket } from '@/facade/bucket';
import { toast } from '@totejs/uikit';
import { BucketProps } from '@bnb-chain/greenfield-chain-sdk/dist/cjs/types';
import { omit } from 'lodash-es';
import { BucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';

export type BucketItem = Omit<BucketProps, 'bucket_info'> & {
  bucket_name: string;
  create_at: number;
  bucket_status: number;
};

export interface BucketState {
  bucketInfo: Record<string, BucketProps['bucket_info']>;
  buckets: Record<string, BucketItem[]>;
  quotas: Record<string, IQuotaProps>;
  loading: boolean;
  currentPage: number;
  // current visit bucket;
  discontinue: boolean;
  owner: boolean;
  editDetail: BucketItem;
  editDelete: BucketItem;
}

const initialState: BucketState = {
  buckets: {},
  bucketInfo: {},
  quotas: {},
  loading: true,
  currentPage: 0,
  discontinue: false,
  owner: true,
  editDetail: {} as BucketItem,
  editDelete: {} as BucketItem,
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {
    setReadQuota(state, { payload }: PayloadAction<{ bucketName: string; quota: IQuotaProps }>) {
      const { bucketName, quota } = payload;
      state.quotas[bucketName] = quota;
    },
    setEditDetail(state, { payload }: PayloadAction<BucketItem>) {
      state.editDetail = payload;
    },
    setEditDelete(state, { payload }: PayloadAction<BucketItem>) {
      state.editDelete = payload;
    },
    setBucketStatus(state, { payload }: PayloadAction<{ discontinue: boolean; owner: boolean }>) {
      const { discontinue, owner } = payload;
      state.discontinue = discontinue;
      state.owner = owner;
    },
    setCurrentBucketPage(state, { payload }: PayloadAction<number>) {
      state.currentPage = payload;
    },
    setLoading(state, { payload }: PayloadAction<boolean>) {
      state.loading = payload;
    },
    setBucketInfo(state, { payload }: PayloadAction<{ address?: string; bucket: BucketInfo }>) {
      const { address, bucket } = payload;
      if (!address) return;
      const bucketName = bucket.bucketName;
      const info = state.bucketInfo[bucketName];
      // todo refactor
      const newInfo = {
        ...info,
        owner: bucket.owner,
        bucket_name: bucket.bucketName,
        visibility: bucket.visibility,
        id: bucket.id,
        source_type: bucket.sourceType.toString(),
        create_at: bucket.createAt.toString(),
        payment_address: bucket.paymentAddress,
        bucket_status: bucket.bucketStatus,
        primary_sp_address: bucket.primarySpAddress,
        charged_read_quota: bucket.chargedReadQuota.toString(),
        // billing_info
      };
      state.bucketInfo[bucketName] = newInfo;
      state.owner = address === newInfo.owner;
      state.discontinue = newInfo.bucket_status === 1;
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

export const setupBucket =
  (bucketName: string, address?: string) => async (dispatch: AppDispatch) => {
    const bucket = await headBucket(bucketName);
    if (!bucket) return 'Bucket no exist';
    dispatch(setBucketInfo({ address, bucket }));
  };

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

export const setupBucketQuota =
  (bucketName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { spInfo } = getState().sp;
    const { bucketInfo } = getState().bucket;
    const spAddress = bucketInfo[bucketName].primary_sp_address;
    const sp = spInfo[spAddress];
    const quota = await getBucketReadQuota(bucketName, sp.endpoint);
    if (!quota) {
      toast.error({ description: 'Get bucket read quota error' });
      return;
    }
    dispatch(setReadQuota({ bucketName, quota }));
  };

export const {
  setBucketList,
  setLoading,
  setCurrentBucketPage,
  setBucketInfo,
  setBucketStatus,
  setEditDetail,
  setEditDelete,
  setReadQuota,
} = bucketSlice.actions;

export default bucketSlice.reducer;
