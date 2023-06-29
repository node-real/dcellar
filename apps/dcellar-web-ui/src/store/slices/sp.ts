import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorageProviders } from '@/facade/sp';
import { StorageProvider } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { AppDispatch } from '@/store';
import { HYDRATE } from 'next-redux-wrapper';

type SpItem = Pick<StorageProvider, 'sealAddress' | 'operatorAddress'>;

export interface SpState {
  sps: Array<SpItem>;
  spInfo: Record<string, StorageProvider>;
}

const initialState: SpState = {
  sps: [],
  spInfo: {},
};

export const spSlice = createSlice({
  name: 'sp',
  initialState,
  reducers: {
    setStorageProviders(state, { payload }: PayloadAction<StorageProvider[]>) {
      state.sps = payload.map((s) => {
        const { sealAddress, operatorAddress } = s;
        state.spInfo[s.operatorAddress] = s;
        state.spInfo[s.sealAddress] = s;
        return { sealAddress, operatorAddress };
      });
    },
  },
});

export const { setStorageProviders } = spSlice.actions;

export const setupStorageProviders = () => async (dispatch: AppDispatch) => {
  const sps = await getStorageProviders();
  dispatch(setStorageProviders(sps));
};

export default spSlice.reducer;
