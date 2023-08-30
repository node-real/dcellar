import { EOperation } from '@/modules/wallet/type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TAccount } from './accounts';

export type TransType = keyof typeof EOperation;

export function isTrans(type: string): type is EOperation {
  return type in EOperation;
}

export interface WalletState {
  transType: TransType;
  fromAccount: TAccount;
  toAccount: TAccount;
  from: string;
  to: string;
}

const initialState: WalletState = {
  transType: 'transfer_in',
  fromAccount: {} as TAccount,
  toAccount: {} as TAccount,
  from: '',
  to: '',
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setTransType(state, { payload }: PayloadAction<TransType>) {
      state.transType = payload;
    },
    setFromAccount: (state, { payload }: PayloadAction<TAccount>) => {
      state.fromAccount = payload;
      state.from = payload.address;
    },
    setToAccount: (state, { payload }: PayloadAction<TAccount>) => {
      state.toAccount = payload;
      state.to = payload.address;
    },
    setTo: (state, { payload }: PayloadAction<string>) => {
      state.to = payload;
    },
    setFrom: (state, { payload }: PayloadAction<string>) => {
      state.from = payload;
    },
  },
});

export const { setTransType, setFromAccount, setToAccount, setFrom, setTo } = walletSlice.actions;

export default walletSlice.reducer;
