import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorageProviders } from '@/facade/sp';
import {
  Description,
  StorageProvider,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { AppDispatch, GetState } from '@/store';
import { omit, random, sortBy } from 'lodash-es';

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
    setStorageProviders(state, { payload }: PayloadAction<StorageProvider[]>) {
      const unsorted = payload.map((s) => {
        const item = {
          ...omit(s, 'description'),
          ...(s.description || defaultDescription()),
        };
        state.spInfo[s.operatorAddress] = item;
        return item;
      });

      const availableSps = unsorted.filter((sp) => sp.moniker !== 'QATest');
      const len = availableSps.length;
      state.oneSp = !len ? '' : availableSps[random(0, len - 1)].operatorAddress;
      state.sps = sortBy(availableSps, ['moniker', 'operatorAddress']);
    },
  },
});

export const { setStorageProviders } = spSlice.actions;

export const setupStorageProviders = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { sps: _sps } = getState().sp;
  if (_sps.length) return;

  const sps = await getStorageProviders();
  dispatch(setStorageProviders(sps));
};

export default spSlice.reducer;
