import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getBucketReadQuota, getUserBuckets, headBucket } from '@/facade/bucket';
import { toast } from '@totejs/uikit';
import { find, omit } from 'lodash-es';
import { getPrimarySpInfo, setPrimarySpInfos, SpItem } from './sp';
import { GetUserBucketsResponse, IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import { BucketInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import {
  SourceType,
  VisibilityType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { setAuthModalOpen } from '@/store/slices/global';

export type BucketOperationsType = 'detail' | 'delete' | 'create' | '';

export type BucketProps = GetUserBucketsResponse['GfSpGetUserBucketsResponse']['Buckets'][0];
export type AllBucketInfo = Omit<BucketProps, 'BucketInfo'> & BucketProps['BucketInfo'];

export type BucketItem = Omit<BucketProps, 'BucketInfo'> & {
  BucketName: string;
  CreateAt: number;
  BucketStatus: number;
};

export interface BucketState {
  bucketInfo: Record<string, AllBucketInfo>;
  buckets: Record<string, BucketItem[]>;
  quotas: Record<string, IQuotaProps>;
  loading: boolean;
  quotaLoading: boolean;
  currentPage: number;
  // current visit bucket;
  discontinue: boolean;
  owner: boolean;
  editDelete: BucketItem;
  editQuota: string[];
  bucketOperation: [string, BucketOperationsType];
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
  editDelete: {} as BucketItem,
  editQuota: ['', ''],
  bucketOperation: ['', ''],
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
    setQuotaLoading(state, { payload }: PayloadAction<boolean>) {
      state.quotaLoading = payload;
    },
    setBucketInfo(state, { payload }: PayloadAction<{ address?: string; bucket: BucketInfo }>) {
      const { address, bucket } = payload;
      if (!address) return;
      const bucketName = bucket.bucketName;
      const info = state.bucketInfo[bucketName];
      const newInfo = {
        ...info,
        Owner: bucket.owner,
        BucketName: bucket.bucketName,
        Visibility: VisibilityType[bucket.visibility] as keyof typeof VisibilityType,
        Id: bucket.id,
        SourceType: SourceType[bucket.sourceType] as keyof typeof SourceType,
        CreateAt: bucket.createAt.toNumber(),
        PaymentAddress: bucket.paymentAddress,
        BucketStatus: Number(bucket.bucketStatus),
        GlobalVirtualGroupFamilyId: bucket.globalVirtualGroupFamilyId,
        ChargedReadQuota: bucket.chargedReadQuota.toNumber(),
      };
      // @ts-ignore
      state.bucketInfo[bucketName] = newInfo;
      state.owner = address === newInfo.Owner;
      state.discontinue = newInfo.BucketStatus === 1;
    },
    setBucketList(state, { payload }: PayloadAction<{ address: string; buckets: BucketProps[] }>) {
      const { address, buckets } = payload;
      state.buckets[address] = buckets
        .map((bucket) => {
          const { BucketName, CreateAt, BucketStatus } = bucket.BucketInfo;
          state.bucketInfo[BucketName] = {
            ...bucket,
            ...bucket.BucketInfo,
          };
          return {
            ...omit(bucket, 'BucketInfo'),
            BucketName,
            CreateAt: Number(CreateAt),
            BucketStatus: Number(BucketStatus),
          };
        })
        .sort((a, b) => b.CreateAt - a.CreateAt);
    },
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
    const bucket = await headBucket(bucketName);
    const { loginAccount } = getState().persist;

    if (!bucket) return 'Bucket no exist';
    dispatch(setBucketInfo({ address: address || loginAccount, bucket }));
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
      toast.error({ description: error || res?.message });
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
      sp: find<SpItem>(allSps, (sp) => sp.id === b.Vgf.PrimarySpId)!,
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
      if (error === 'invalid signature') {
        dispatch(setAuthModalOpen([true, { action: 'quota', params: { bucketName } }]));
      } else {
        toast.error({ description: error || 'Get bucket read quota error' });
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
  setEditDelete,
  setReadQuota,
  setEditQuota,
  setQuotaLoading,
  setBucketOperation,
} = bucketSlice.actions;

export default bucketSlice.reducer;
