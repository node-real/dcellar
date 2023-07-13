import { EOperation } from '@/modules/wallet/type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TransType = keyof typeof EOperation;

export function isTrans(type: string): type is EOperation {
  return type in EOperation;
}

export interface WalletState {
  transType: TransType;
}

const initialState: WalletState = {
  transType: 'transfer_in',
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setTransType(state, { payload }: PayloadAction<TransType>) {
      state.transType = payload;
    },
  },
});

export const { setTransType } = walletSlice.actions;

export default walletSlice.reducer;
