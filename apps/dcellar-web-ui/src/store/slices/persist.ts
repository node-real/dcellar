import { createSlice } from '@reduxjs/toolkit';

export type PersistedAccountConfig = {
  seedString: string;
  directDownload: boolean;
  directView: boolean;
};

export interface PersistState {
  accounts: Record<string, PersistedAccountConfig>;
}

const initialState: PersistState = {
  accounts: {},
};

export const persistSlice = createSlice({
  name: 'persist',
  initialState,
  reducers: {},
});

export default persistSlice.reducer;
