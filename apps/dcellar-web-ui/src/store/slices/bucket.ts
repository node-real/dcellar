import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getBucketReadQuota, getUserBucketMeta, getUserBuckets } from '@/facade/bucket';
import { toast } from '@totejs/uikit';
import { find, isEmpty, omit } from 'lodash-es';
import { getPrimarySpInfo, setPrimarySpInfos, SpItem } from './sp';
import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import { setAuthModalOpen } from '@/store/slices/global';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { DEFAULT_TAG } from '@/components/common/ManageTag';
import { BucketMetaWithVGF } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { convertObjectKey } from '@/utils/common';

export type BucketOperationsType = 'detail' | 'delete' | 'create' | 'marketplace' | '';

export type BucketProps = BucketMetaWithVGF;
export type TBucket = Omit<BucketProps, 'BucketInfo'> & BucketProps['BucketInfo'];

export type BucketItem = Omit<BucketProps, 'BucketInfo'> & {
  BucketName: string;
  CreateAt: number;
  BucketStatus: number;
  Id: string;
};

export interface BucketState {
  bucketInfo: Record<string, TBucket>;
  buckets: Record<string, BucketItem[]>;
  quotas: Record<string, IQuotaProps>;
  loading: boolean;
  quotaLoading: boolean;
  currentPage: number;
  // current visit bucket;
  discontinue: boolean;
  owner: boolean;
  editQuota: string[];
  bucketOperation: [string, BucketOperationsType];
  editTags: [string, string];
  editTagsData: ResourceTags_Tag[];
}

const initialState: BucketState = {
  buckets: {},
  bucketInfo: {},
  quotas: {},
  loading: false,
  quotaLoading: false,
  currentPage: 0,
  discontinue: false,
  owner: true,
  editQuota: ['', ''],
  bucketOperation: ['', ''],
  editTags: ['', '',],
  editTagsData: [DEFAULT_TAG]
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {
    setBucketOperation(state, { payload }: PayloadAction<[string, BucketOperationsType]>) {
      state.bucketOperation = payload;
    },
    setReadQuota(state, { payload }: PayloadAction<{ bucketName: string; quota: IQuotaProps }>) {
      const { bucketName, quota } = payload;
      state.quotas[bucketName] = quota;
    },
    setEditQuota(state, { payload }: PayloadAction<string[]>) {
      state.editQuota = payload;
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
    setQuotaLoading(state, { payload }: PayloadAction<boolean>) {
      state.quotaLoading = payload;
    },
    setBucketInfo(state, { payload }: PayloadAction<{ address?: string; bucket: TBucket }>) {
      const { address, bucket } = payload;
      if (!address) return;
      const bucketName = bucket.BucketName;
      const info = state.bucketInfo[bucketName];
      const newInfo = {
        ...info,
        ...bucket,
      };
      state.bucketInfo[bucketName] = newInfo;
      state.owner = address === newInfo.Owner;
      state.discontinue = newInfo.BucketStatus === 1;
    },
    setBucketList(state, { payload }: PayloadAction<{ address: string; buckets: BucketProps[] }>) {
      const { address, buckets } = payload;
      state.buckets[address] = buckets
        .map((bucket) => {
          const { BucketName, CreateAt, BucketStatus, Id } = bucket.BucketInfo;
          state.bucketInfo[BucketName] = {
            ...bucket,
            ...bucket.BucketInfo,
          };
          return {
            ...omit(bucket, 'BucketInfo'),
            BucketName,
            Id,
            CreateAt: Number(CreateAt),
            BucketStatus: Number(BucketStatus),
          };
        })
        .sort((a, b) => b.CreateAt - a.CreateAt);
    },
    setEditBucketTags(state, { payload }: PayloadAction<[string, string]>) {
      state.editTags = payload;
    },
    setEditBucketTagsData(state, { payload }: PayloadAction<ResourceTags_Tag[]>) {
      state.editTagsData = payload;
    },
    setBucketTags(state, { payload }: PayloadAction<{bucketName: string, tags: ResourceTags_Tag[] }>) {
      const { bucketName, tags } = payload;
      const newTags = tags.map(item => convertObjectKey(tags, 'uppercase'));
      state.bucketInfo[bucketName]['Tags']['Tags'] = newTags as Extract<TBucket['Tags'], { 'Tags': any }>['Tags'];
    }
  },
});

const defaultBucketList = Array<BucketItem>();
export const selectBucketList = (address: string) => (root: AppState) => {
  return root.bucket.buckets[address] || defaultBucketList;
};

export const selectHasDiscontinue = (address: string) => (root: AppState) =>
  (root.bucket.buckets[address] || defaultBucketList).some((i) => i.BucketStatus === 1);

export const setupBucket =
  (bucketName: string, address?: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const [res, error] = await getUserBucketMeta(bucketName, '');
    if (error || isEmpty(res?.body)) return 'Bucket no exist';
    const bucket = {
      ...res?.body?.GfSpGetBucketMetaResponse.Bucket,
      ...res?.body?.GfSpGetBucketMetaResponse.Bucket.BucketInfo,
    } as TBucket;
    const { loginAccount } = getState().persist;
    dispatch(setBucketInfo({ address: address || loginAccount, bucket: bucket }));
  };

export const setupBuckets =
  (address: string, forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { oneSp, spInfo, allSps } = getState().sp;
    const { buckets, loading } = getState().bucket;
    const sp = spInfo[oneSp];
    if (loading) return;
    if (!(address in buckets) || forceLoading) {
      dispatch(setLoading(true));
    }
    const [res, error] = await getUserBuckets(address, sp.endpoint);
    dispatch(setLoading(false));
    if (error || !res || res.code !== 0) {
      if (!res?.message?.includes('record not found')) {
        toast.error({ description: error || res?.message });
      }
      if (!buckets[address]?.length) {
        dispatch(setBucketList({ address, buckets: [] }));
      }
      return;
    }
    const bucketList =
      res.body?.map((bucket) => {
        return {
          ...bucket,
          BucketInfo: {
            ...bucket.BucketInfo,
          },
        };
      }) || [];

    const bucketSpInfo = bucketList.map((b) => ({
      bucketName: b.BucketInfo.BucketName,
      sp: find<SpItem>(allSps, (sp) => String(sp.id) === String(b.Vgf.PrimarySpId))!,
    }));

    dispatch(setPrimarySpInfos(bucketSpInfo));
    dispatch(setBucketList({ address, buckets: bucketList }));
  };

export const setupBucketQuota =
  (bucketName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { bucketInfo, quotaLoading } = getState().bucket;
    if (quotaLoading) return;
    const info = bucketInfo[bucketName];
    if (!info) return;
    dispatch(setQuotaLoading(true));
    const sp = await dispatch(getPrimarySpInfo(bucketName, +info.GlobalVirtualGroupFamilyId));
    if (!sp) {
      dispatch(setQuotaLoading(false));
      return;
    }
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, sp.operatorAddress));
    const [quota, error] = await getBucketReadQuota({
      bucketName,
      endpoint: sp.endpoint,
      seedString,
      address: loginAccount,
    });
    dispatch(setQuotaLoading(false));
    if (quota === null) {
      if (
        ['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')
      ) {
        dispatch(setAuthModalOpen([true, { action: 'quota', params: { bucketName } }]));
      } else {
        console.error({ description: error || 'Get bucket read quota error' });
      }
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
  setReadQuota,
  setEditQuota,
  setQuotaLoading,
  setBucketOperation,
  setBucketTags,
  setEditBucketTags,
  setEditBucketTagsData,
} = bucketSlice.actions;

export default bucketSlice.reducer;
