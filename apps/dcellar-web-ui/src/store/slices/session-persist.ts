import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionPersistState {
  closeRenewalAddresses: string[];
}

const initialState: SessionPersistState = {
  closeRenewalAddresses: [],
};

export const sessionPersistSlice = createSlice({
  name: 'sessionPersist',
  initialState,
  reducers: {
    setCloseRenewalAddresses(state, { payload }: PayloadAction<string[]>) {
      state.closeRenewalAddresses = payload;
    },
  },
});

export const { setCloseRenewalAddresses } = sessionPersistSlice.actions;

export default sessionPersistSlice.reducer;
