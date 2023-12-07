import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getSpMeta, getStorageProviders } from '@/facade/sp';
import {
  Description,
  StorageProvider,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { AppDispatch, GetState } from '@/store';
import { chunk, find, omit, random, sortBy } from 'lodash-es';
import { getVirtualGroupFamily } from '@/facade/virtual-group';
import { AllBucketInfo } from '@/store/slices/bucket';
import { RootState } from '@/store/reducers';
import { getDomain } from '@/utils/bom';

const defaultDescription = (): Description => ({
  moniker: '',
  identity: '',
  website: '',
  securityContact: '',
  details: '',
});

export type SpItem = Omit<StorageProvider, 'description'> & Description;

export type SpMeta = {
  Description: string;
  Endpoint: string;
  FreeReadQuota: number;
  Latency: number;
  ReadPrice: string;
  SPAddress: string;
  StakedBnb: string;
  Status: string;
  StorePrice: string;
};

export interface SpState {
  sps: Array<SpItem>;
  allSps: Array<SpItem>; // include unstable
  spInfo: Record<string, SpItem>;
  primarySpInfo: Record<string, SpItem>;
  oneSp: string;
  spMeta: Record<string, SpMeta>;
  latency: Record<string, number>;
  // latencyCacheTime: number;
}

const initialState: SpState = {
  sps: [],
  allSps: [],
  spInfo: {},
  primarySpInfo: {},
  oneSp: '', // operatorAddress
  spMeta: {},
  latency: {},
  // latencyCacheTime: 0,
};

export const spSlice = createSlice({
  name: 'sp',
  initialState,
  reducers: {
    setSpLatency(state, { payload }: PayloadAction<Record<string, number>>) {
      state.latency = {
        ...state.latency,
        ...payload,
      };
      // state.latencyCacheTime = Date.now();
    },
    setSpMeta(state, { payload }: PayloadAction<SpMeta[]>) {
      payload.forEach((meta) => {
        state.spMeta[meta.Endpoint] = meta;
      });
    },
    setStorageProviders(
      state,
      {
        payload,
      }: PayloadAction<{ sps: StorageProvider[]; faultySps: string[]; recommend: string[] }>,
    ) {
      const { sps, faultySps, recommend } = payload;
      const unsorted = sps.map((s) => {
        const item = {
          ...omit(s, 'description'),
          ...(s.description || defaultDescription()),
        };
        // ensure all sp info recorded
        state.spInfo[s.operatorAddress] = item;
        return item;
      });

      const availableSps = unsorted.filter((sp) => sp.moniker !== 'QATest');
      const sorted = sortBy(availableSps, ['moniker', 'operatorAddress']);
      state.allSps = sorted;
      state.sps = sorted.filter((s) => !faultySps.includes(s.operatorAddress));
      const rsps = recommend
        .map((r) => {
          const sp = find<SpItem>(state.sps, (s) => s.moniker.toLowerCase() === r.toLowerCase());
          return sp?.operatorAddress || '';
        })
        .filter(Boolean);
      if (rsps.length) {
        state.oneSp = rsps[random(0, rsps.length - 1)];
      } else {
        const len = state.sps.length;
        state.oneSp = !len ? '' : state.sps[random(0, len - 1)]?.operatorAddress;
      }
    },
    setPrimarySpInfo(state, { payload }: PayloadAction<{ bucketName: string; sp: SpItem }>) {
      const { bucketName, sp } = payload;
      state.primarySpInfo[bucketName] = sp;
    },
    setPrimarySpInfos(
      state,
      { payload }: PayloadAction<Array<{ bucketName: string; sp: SpItem }>>,
    ) {
      payload.forEach(({ bucketName, sp }) => {
        state.primarySpInfo[bucketName] = sp;
      });
    },
    updateSps(state, { payload }: PayloadAction<string[]>) {
      state.sps = state.sps.filter((sp) => payload.includes(sp.operatorAddress));
      // state.oneSp = payload[0];
    },
  },
});

export const selectBucketSp = (bucket: AllBucketInfo) => (state: RootState) => {
  const { allSps } = state.sp;
  return find<SpItem>(allSps, (sp) => String(sp.id) === String(bucket.Vgf.PrimarySpId));
};

export const {
  setStorageProviders,
  setPrimarySpInfo,
  setPrimarySpInfos,
  updateSps,
  setSpMeta,
  setSpLatency,
} = spSlice.actions;

export const setupStorageProviders = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { sps: _sps } = getState().sp;
  const { faultySps } = getState().persist;
  const { RECOMMEND_SPS } = getState().apollo;
  if (_sps.length) return;

  const sps = await getStorageProviders();
  const recommend = (RECOMMEND_SPS || '')
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);
  dispatch(setStorageProviders({ sps, faultySps, recommend }));
};

export const setupSpMeta = () => async (dispatch: AppDispatch) => {
  const list = await getSpMeta();
  dispatch(setSpMeta(list || []));
};

export const getPrimarySpInfo =
  (bucketName: string, familyId: number) => async (dispatch: AppDispatch, getState: GetState) => {
    const { allSps, primarySpInfo } = getState().sp;
    const primarySp = primarySpInfo[bucketName];
    if (primarySp) return primarySp;
    const [data, error] = await getVirtualGroupFamily({ familyId });
    if (error) return null;
    const sp = allSps.find(
      (item) => String(item.id) === String(data?.globalVirtualGroupFamily?.primarySpId),
    ) as SpItem;
    if (!sp) return null;
    dispatch(setPrimarySpInfo({ bucketName, sp }));
    return sp;
  };

export const updateSpLatency =
  (endpoints: string[], address: string) => async (dispatch: AppDispatch, getState: GetState) => {
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
              .fetch(`${endpoint}/auth/request_nonce`, {
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
