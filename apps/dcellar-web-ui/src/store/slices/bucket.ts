import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import { BucketMetaWithVGF } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { toast } from '@node-real/uikit';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { find, isEmpty, omit } from 'lodash-es';
import { SpEntity, setupPrimarySpInfo, setPrimarySpInfos } from './sp';
import { DEFAULT_TAG } from '@/components/common/ManageTags';
import {
  getBucketActivities,
  getBucketReadQuota,
  getUserBucketMeta,
  getUserBuckets,
} from '@/facade/bucket';
import { AppDispatch, AppState, GetState } from '@/store';
import { setAuthModalOpen } from '@/store/slices/global';
import { getSpOffChainData } from '@/store/slices/persist';
import { convertObjectKey } from '@/utils/common';
import { Activity } from './object';
import { numberToHex } from 'viem';
import { BucketStatus as BucketStatusEnum } from '@bnb-chain/greenfield-js-sdk';

export type BucketOperationsType =
  | 'detail'
  | 'delete'
  | 'create'
  | 'share'
  | 'marketplace'
  | 'payment_account'
  | 'edit_tags'
  | 'update_tags'
  | 'migrate'
  | '';

export type BucketProps = BucketMetaWithVGF;
export type TBucket = Omit<BucketProps, 'BucketInfo'> & BucketProps['BucketInfo'];
export type BucketEntity = Omit<BucketProps, 'BucketInfo'> & {
  BucketName: string;
  CreateAt: number;
  BucketStatus: number;
  Id: string;
};

export interface BucketState {
  bucketRecords: Record<string, TBucket>;
  bucketListRecords: Record<string, BucketEntity[]>;
  bucketQuotaRecords: Record<string, IQuotaProps>;
  bucketListLoading: boolean;
  bucketQuotaLoading: boolean;
  bucketListPage: number;
  // current visit bucket;
  isBucketDiscontinue: boolean;
  isBucketOwner: boolean;
  isBucketMigrating: boolean;
  bucketEditQuota: string[];
  bucketOperation: Record<0 | 1, [string, BucketOperationsType]>;
  bucketEditTagsData: ResourceTags_Tag[];
  bucketActivityRecords: Record<string, Activity[]>;
}

const initialState: BucketState = {
  bucketListRecords: {},
  bucketRecords: {},
  bucketQuotaRecords: {},
  bucketListLoading: false,
  bucketQuotaLoading: false,
  bucketListPage: 0,
  isBucketDiscontinue: false,
  isBucketOwner: true,
  isBucketMigrating: false,
  bucketEditQuota: ['', ''],
  bucketOperation: { 0: ['', ''], 1: ['', ''] },
  bucketEditTagsData: [DEFAULT_TAG],
  bucketActivityRecords: {},
};

export const bucketSlice = createSlice({
  name: 'bucket',
  initialState,
  reducers: {
    setBucketOperation(
      state,
      { payload }: PayloadAction<{ level?: 0 | 1; operation: [string, BucketOperationsType] }>,
    ) {
      state.bucketOperation[payload.level || 0] = payload.operation;
    },
    setBucketQuota(state, { payload }: PayloadAction<{ bucketName: string; quota: IQuotaProps }>) {
      const { bucketName, quota } = payload;
      state.bucketQuotaRecords[bucketName] = quota;
    },
    setBucketEditQuota(state, { payload }: PayloadAction<string[]>) {
      state.bucketEditQuota = payload;
    },
    setBucketStatus(
      state,
      {
        payload,
      }: PayloadAction<{
        isBucketDiscontinue: boolean;
        isBucketOwner: boolean;
        isBucketMigrating: boolean;
      }>,
    ) {
      const { isBucketDiscontinue, isBucketOwner, isBucketMigrating } = payload;
      state.isBucketDiscontinue = isBucketDiscontinue;
      state.isBucketOwner = isBucketOwner;
      state.isBucketMigrating = isBucketMigrating;
    },
    setBucketListPage(state, { payload }: PayloadAction<number>) {
      state.bucketListPage = payload;
    },
    setBucketListLoading(state, { payload }: PayloadAction<boolean>) {
      state.bucketListLoading = payload;
    },
    setBucketQuotaLoading(state, { payload }: PayloadAction<boolean>) {
      state.bucketQuotaLoading = payload;
    },
    setBucket(state, { payload }: PayloadAction<{ address?: string; bucket: TBucket }>) {
      const { address, bucket } = payload;
      if (!address) return;
      const bucketName = bucket.BucketName;
      const info = state.bucketRecords[bucketName];
      const newInfo = { ...info, ...bucket };
      state.bucketRecords[bucketName] = newInfo;
      state.isBucketOwner = address === newInfo.Owner;
      state.isBucketDiscontinue =
        newInfo.BucketStatus === BucketStatusEnum.BUCKET_STATUS_DISCONTINUED;
      state.isBucketMigrating = newInfo.BucketStatus === BucketStatusEnum.BUCKET_STATUS_MIGRATING;
    },
    setBucketList(state, { payload }: PayloadAction<{ address: string; buckets: BucketProps[] }>) {
      const { address, buckets } = payload;
      state.bucketListRecords[address] = buckets
        .map((bucket) => {
          const { BucketName, CreateAt, BucketStatus, Id } = bucket.BucketInfo;
          state.bucketRecords[BucketName] = { ...bucket, ...bucket.BucketInfo };
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
    setBucketTagsEditData(state, { payload }: PayloadAction<ResourceTags_Tag[]>) {
      state.bucketEditTagsData = payload;
    },
    setBucketTags(
      state,
      { payload }: PayloadAction<{ bucketName: string; tags: ResourceTags_Tag[] }>,
    ) {
      const { bucketName, tags } = payload;
      const newTags = tags.map((item) => convertObjectKey(item, 'uppercase'));
      state.bucketRecords[bucketName]['Tags']['Tags'] = newTags as Extract<
        TBucket['Tags'],
        { Tags: any }
      >['Tags'];
    },
    setBucketPaymentAccount(
      state,
      { payload }: PayloadAction<{ bucketName: string; paymentAddress: string }>,
    ) {
      const { bucketName, paymentAddress } = payload;
      state.bucketRecords[bucketName]['PaymentAddress'] = paymentAddress;
    },
    setBucketActivity(
      state,
      { payload }: PayloadAction<{ activities: Activity[]; bucketName: string }>,
    ) {
      const { bucketName, activities } = payload;
      state.bucketActivityRecords[bucketName] = activities;
    },
  },
});

export const {
  setBucketList,
  setBucketListLoading,
  setBucketListPage,
  setBucket,
  setBucketStatus,
  setBucketQuota,
  setBucketEditQuota,
  setBucketQuotaLoading,
  setBucketOperation,
  setBucketTags,
  setBucketTagsEditData,
  setBucketPaymentAccount,
  setBucketActivity,
} = bucketSlice.actions;

const defaultBucketList = Array<BucketEntity>();
export const selectBucketList = (address: string) => (root: AppState) => {
  return root.bucket.bucketListRecords[address] || defaultBucketList;
};

export const selectBucketListSpinning = (address: string) => (root: AppState) => {
  const { bucketListLoading, bucketListRecords } = root.bucket;
  return !(address in bucketListRecords) || bucketListLoading;
};

export const selectHasDiscontinueBucket = (address: string) => (root: AppState) =>
  (root.bucket.bucketListRecords[address] || defaultBucketList).some(
    (i) => i.BucketStatus === BucketStatusEnum.BUCKET_STATUS_DISCONTINUED,
  );

export const setupBucket =
  (bucketName: string, address?: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const [res, error] = await getUserBucketMeta(bucketName, '');
    if (error || isEmpty(res?.body)) return 'Bucket no exist';
    const bucket = {
      ...res?.body?.GfSpGetBucketMetaResponse.Bucket,
      ...res?.body?.GfSpGetBucketMetaResponse.Bucket.BucketInfo,
    } as TBucket;
    const { loginAccount } = getState().persist;
    dispatch(setBucket({ address: address || loginAccount, bucket: bucket }));
  };

export const setupBucketList =
  (address: string, forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { specifiedSp, spRecords, allSpList } = getState().sp;
    const { bucketListRecords, bucketListLoading } = getState().bucket;
    const sp = spRecords[specifiedSp];

    if (bucketListLoading) return;
    if (!(address in bucketListRecords) || forceLoading) {
      dispatch(setBucketListLoading(true));
    }

    const [res, error] = await getUserBuckets(address, sp.endpoint);
    dispatch(setBucketListLoading(false));

    if (error || !res || res.code !== 0) {
      if (!res?.message?.includes('record not found')) {
        toast.error({ description: error || res?.message });
      }
      if (!bucketListRecords[address]?.length) {
        dispatch(setBucketList({ address, buckets: [] }));
      }
      return;
    }

    const bucketList =
      res.body?.map((bucket) => ({ ...bucket, BucketInfo: { ...bucket.BucketInfo } })) || [];

    const bucketSpInfo = bucketList.map((b) => ({
      bucketName: b.BucketInfo.BucketName,
      sp: find<SpEntity>(allSpList, (sp) => String(sp.id) === String(b.Vgf.PrimarySpId))!,
    }));

    dispatch(setPrimarySpInfos(bucketSpInfo));
    dispatch(setBucketList({ address, buckets: bucketList }));
  };

export const setupBucketQuota =
  (bucketName: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { bucketRecords, bucketQuotaLoading } = getState().bucket;
    if (bucketQuotaLoading) return;

    const info = bucketRecords[bucketName];
    if (!info) return;

    dispatch(setBucketQuotaLoading(true));
    const sp = await dispatch(setupPrimarySpInfo(bucketName, +info.GlobalVirtualGroupFamilyId));
    if (!sp) {
      dispatch(setBucketQuotaLoading(false));
      return;
    }

    const { seedString } = await dispatch(getSpOffChainData(loginAccount, sp.operatorAddress));
    const [quota, error] = await getBucketReadQuota({
      bucketName,
      endpoint: sp.endpoint,
      seedString,
      address: loginAccount,
    });

    dispatch(setBucketQuotaLoading(false));

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
    dispatch(setBucketQuota({ bucketName, quota }));
  };

export const setupBucketActivity =
  (bucketName: string, id: string) => async (dispatch: AppDispatch) => {
    const activities = await getBucketActivities(numberToHex(Number(id), { size: 32 }));
    dispatch(setBucketActivity({ bucketName, activities }));
  };

export default bucketSlice.reducer;
