import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorageProviders } from '@/facade/sp';
import {
  Description,
  StorageProvider,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { AppDispatch, GetState } from '@/store';
import { find, omit, random, sortBy } from 'lodash-es';

const defaultDescription = (): Description => ({
  moniker: '',
  identity: '',
  website: '',
  securityContact: '',
  details: '',
});

export type SpItem = Omit<StorageProvider, 'description'> & Description;

export interface SpState {
  sps: Array<SpItem>;
  spInfo: Record<string, SpItem>;
  oneSp: string;
}

const initialState: SpState = {
  sps: [],
  spInfo: {},
  oneSp: '', // operatorAddress
};

export const spSlice = createSlice({
  name: 'sp',
  initialState,
  reducers: {
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
      state.sps = sortBy(availableSps, ['moniker', 'operatorAddress']).filter(
        (s) => !faultySps.includes(s.operatorAddress),
      );
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
    updateSps(state, { payload }: PayloadAction<string[]>) {
      state.sps = state.sps.filter((sp) => payload.includes(sp.operatorAddress));
      // state.oneSp = payload[0];
    },
    filterSps(state, { payload }: PayloadAction<string[]>) {
      state.sps = state.sps.filter((s) => !payload.includes(s.operatorAddress));
      // const len = state.sps.length;
      // state.oneSp = state.sps[random(0, len - 1)]?.operatorAddress;
    },
  },
});

export const { setStorageProviders, updateSps, filterSps } = spSlice.actions;

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

export default spSlice.reducer;