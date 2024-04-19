import {
  Description,
  StorageProvider,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { chunk, find, omit, random, sortBy } from 'lodash-es';

import { getSpMeta, getStorageProviders } from '@/facade/sp';
import { getVirtualGroupFamily } from '@/facade/virtual-group';
import { AppDispatch, GetState } from '@/store';
import { RootState } from '@/store/reducers';
import { TBucket } from '@/store/slices/bucket';
import { getDomain } from '@/utils/bom';

const defaultDescription = (): Description => ({
  moniker: '',
  identity: '',
  website: '',
  securityContact: '',
  details: '',
});

export type SpEntity = Omit<StorageProvider, 'description'> & Description;

export type SpRecommendMeta = {
  Description: string;
  Endpoint: string;
  FreeReadQuota: number;
  MonthlyFreeQuota: number;
  Latency: number;
  ReadPrice: string;
  SPAddress: string;
  StakedBnb: string;
  Status: string;
  StorePrice: string;
};

export interface SpState {
  availableSpList: Array<SpEntity>;
  allSpList: Array<SpEntity>; // include unstable
  spRecords: Record<string, SpEntity>;
  primarySpRecords: Record<string, SpEntity>;
  specifiedSp: string;
  spMetaRecords: Record<string, SpRecommendMeta>;
  spLatencyRecords: Record<string, number>;
}

const initialState: SpState = {
  availableSpList: [],
  allSpList: [],
  spRecords: {},
  primarySpRecords: {},
  specifiedSp: '', // operatorAddress
  spMetaRecords: {},
  spLatencyRecords: {},
};

export const spSlice = createSlice({
  name: 'sp',
  initialState,
  reducers: {
    setSpLatency(state, { payload }: PayloadAction<Record<string, number>>) {
      state.spLatencyRecords = { ...state.spLatencyRecords, ...payload };
    },
    setSpRecommendMeta(state, { payload }: PayloadAction<SpRecommendMeta[]>) {
      payload.forEach((meta) => {
        state.spMetaRecords[meta.Endpoint] = meta;
      });
    },
    setStorageProviders(
      state,
      {
        payload,
      }: PayloadAction<{ sps: StorageProvider[]; unAvailableSps: string[]; recommend: string[] }>,
    ) {
      const { sps, unAvailableSps, recommend } = payload;
      const unsorted = sps.map((s) => {
        const item = {
          ...omit(s, 'description'),
          ...(s.description || defaultDescription()),
        };
        // ensure all sp info recorded
        state.spRecords[s.operatorAddress] = item;
        return item;
      });

      const availableSps = unsorted.filter((sp) => sp.moniker !== 'QATest');
      const sorted = sortBy(availableSps, ['moniker', 'operatorAddress']);
      state.allSpList = sorted;
      state.availableSpList = sorted.filter((s) => !unAvailableSps.includes(s.operatorAddress));
      const rsps = recommend
        .map((r) => {
          const sp = find<SpEntity>(
            state.availableSpList,
            (s) => s.moniker.toLowerCase() === r.toLowerCase(),
          );
          return sp?.operatorAddress || '';
        })
        .filter(Boolean);
      if (rsps.length) {
        state.specifiedSp = rsps[random(0, rsps.length - 1)];
      } else {
        const len = state.availableSpList.length;
        state.specifiedSp = !len ? '' : state.availableSpList[random(0, len - 1)]?.operatorAddress;
      }
    },
    setPrimarySpInfo(state, { payload }: PayloadAction<{ bucketName: string; sp: SpEntity }>) {
      const { bucketName, sp } = payload;
      state.primarySpRecords[bucketName] = sp;
    },
    setPrimarySpInfos(
      state,
      { payload }: PayloadAction<Array<{ bucketName: string; sp: SpEntity }>>,
    ) {
      payload.forEach(({ bucketName, sp }) => {
        state.primarySpRecords[bucketName] = sp;
      });
    },
    setNewAvailableSpList(state, { payload }: PayloadAction<string[]>) {
      state.availableSpList = state.availableSpList.filter((sp) =>
        payload.includes(sp.operatorAddress),
      );
      // state.oneSp = payload[0];
    },
  },
});

export const {
  setStorageProviders,
  setPrimarySpInfo,
  setPrimarySpInfos,
  setNewAvailableSpList,
  setSpRecommendMeta,
  setSpLatency,
} = spSlice.actions;

export const selectBucketSp = (bucket: TBucket) => (state: RootState) => {
  const { allSpList } = state.sp;
  return find<SpEntity>(allSpList, (sp) => String(sp.id) === String(bucket.Vgf.PrimarySpId));
};

export const setupStorageProviders = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { availableSpList: _sps } = getState().sp;
  const { unAvailableSps } = getState().persist;
  const { RECOMMEND_SPS } = getState().apollo;
  if (_sps.length) return;

  const sps = await getStorageProviders();
  const recommend = (RECOMMEND_SPS || '')
    .split(',')
    .map((i: string) => i.trim())
    .filter(Boolean);
  dispatch(setStorageProviders({ sps, unAvailableSps: unAvailableSps, recommend }));
};

export const setupSpMeta = () => async (dispatch: AppDispatch) => {
  const list = await getSpMeta();
  dispatch(setSpRecommendMeta(list || []));
};

export const setupPrimarySpInfo =
  (bucketName: string, familyId: number) => async (dispatch: AppDispatch, getState: GetState) => {
    const { allSpList, primarySpRecords } = getState().sp;
    const primarySp = primarySpRecords[bucketName];
    if (primarySp) return primarySp;
    const [data, error] = await getVirtualGroupFamily({ familyId });
    if (error) return null;
    const sp = allSpList.find(
      (item) => String(item.id) === String(data?.globalVirtualGroupFamily?.primarySpId),
    ) as SpEntity;
    if (!sp) return null;
    dispatch(setPrimarySpInfo({ bucketName, sp }));
    return sp;
  };

export const setupSpLatency = (endpoints: string[], address: string) => async () => {
  // const { latencyCacheTime } = getState().sp;
  //
  // if (Date.now() - latencyCacheTime < 1000 * 60 * 5) {
  //   return;
  // }

  const endpointsGroup = chunk(endpoints, 4);
  for await (const group of endpointsGroup) {
    if (!group.length) continue;

    await Promise.all(
      group.map(async (endpoint) => {
        await Promise.race([
          window
            .fetch(`${endpoint}/status`, {
              headers: new Headers({
                'X-Gnfd-User-Address': address,
                'X-Gnfd-App-Domain': getDomain(),
              }),
            })
            .catch(),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);
      }),
    );
  }
};

export default spSlice.reducer;
