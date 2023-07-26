import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getBucketReadQuota, getUserBuckets, headBucket } from '@/facade/bucket';
import { toast } from '@totejs/uikit';
import { BucketProps } from '@bnb-chain/greenfield-chain-sdk/dist/cjs/types';
import { omit } from 'lodash-es';
import { BucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import { checkZkWasm } from '@/utils/sp';
import { SpItem } from './sp';

export type TBucketInfo = BucketInfo & {
  primarySpAddress: string;
}

export type TBucketProps = BucketProps & {
  bucket_info: Omit<BucketProps['bucket_info'], 'bucket_name'> & { primary_sp_address: string };
};

export type BucketItem = Omit<TBucketProps, 'bucket_info'> & {
  bucket_name: string;
  create_at: number;
  bucket_status: number;
};

export interface BucketState {
  bucketInfo: Record<string, TBucketProps['bucket_info']>;
  buckets: Record<string, BucketItem[]>;
  quotas: Record<string, IQuotaProps>;
  loading: boolean;
  currentPage: number;
  // current visit bucket;
  discontinue: boolean;
  owner: boolean;
  editDetail: BucketItem;
  editDelete: BucketItem;
  editCreate: boolean;
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
  editCreate: false,
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {
    setReadQuota(state, { payload }: PayloadAction<{ bucketName: string; quota: IQuotaProps }>) {
      const { bucketName, quota } = payload;
      state.quotas[bucketName] = quota;
    },
    setEditCreate(state, { payload }: PayloadAction<boolean>) {
      state.editCreate = payload;
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
    setBucketInfo(state, { payload }: PayloadAction<{ address?: string; bucket: TBucketInfo}>) {
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
        primary_sp_id: bucket.primarySpId,
        primary_sp_address: bucket.primarySpAddress,
        global_virtual_group_family_id: bucket.globalVirtualGroupFamilyId,
        charged_read_quota: bucket.chargedReadQuota.toString(),
        // billing_info
      };
      state.bucketInfo[bucketName] = newInfo;
      state.owner = address === newInfo.owner;
      state.discontinue = newInfo.bucket_status === 1;
    },
    setBucketList(state, { payload }: PayloadAction<{ address: string; buckets: TBucketProps[] }>) {
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
  (bucketName: string, address?: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const bucket = await headBucket(bucketName);
    const { allSps } = getState().sp;
    const primarySpAddress = allSps.find(sp => sp.id === bucket?.primarySpId)?.operatorAddress || '';
    const newBucket = {
      ...bucket,
      primarySpAddress,
    } as TBucketInfo;
    if (!bucket) return 'Bucket no exist';
    dispatch(setBucketInfo({ address, bucket: newBucket }));
  };

export const setupBuckets =
  (address: string, forceLoading = false) =>
    async (dispatch: AppDispatch, getState: GetState) => {
      const { oneSp, spInfo, allSps } = getState().sp;
      const { buckets } = getState().bucket;
      const sp = spInfo[oneSp];
      if (!(address in buckets) || forceLoading) {
        dispatch(setLoading(true));
      }
      const [res, error] = await getUserBuckets(address, sp.endpoint);
      dispatch(setLoading(false));
      if (error || !res || res.code !== 0) {
        toast.error({ description: error || res?.message });
        return;
      }
      const bucketList = res.body?.map((bucket) => {
        const primarySp = allSps.find(sp => sp.id === bucket.bucket_info.primary_sp_id) as SpItem;
        return {
          ...bucket,
          bucket_info: {
            ...bucket.bucket_info,
            primary_sp_address: primarySp.operatorAddress,
          },
        }
      })
      dispatch(setBucketList({ address, buckets: bucketList || [] }));
    };

export const setupBucketQuota =
  (bucketName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { allSps } = getState().sp;
    const { loginAccount } = getState().persist;
    const { bucketInfo } = getState().bucket;
    const info = bucketInfo[bucketName];
    if (!info) return;
    const spId = bucketInfo[bucketName].primary_sp_id;
    const sp = allSps.find(sp => sp.id === spId);
    const isLoad = await checkZkWasm();
    if (!isLoad || !sp) {
      return toast.error({ description: 'The current network is weak.' });
    }
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, sp.operatorAddress));
    const [quota, error] = await getBucketReadQuota({
      bucketName,
      endpoint: sp?.endpoint,
      seedString,
      address: loginAccount
    });
    if (quota === null) {
      return toast.error({ description: error || 'Get bucket read quota error' });
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
  setEditCreate,
} = bucketSlice.actions;

export default bucketSlice.reducer;
