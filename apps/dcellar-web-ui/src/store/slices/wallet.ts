import { EOperation } from '@/modules/wallet/type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TAccount } from './accounts';

export function isTransferOperation(type: string): type is EOperation {
  return type in EOperation;
}

export type TransferType = keyof typeof EOperation;

export interface WalletState {
  transferType: TransferType;
  transferFromAccount: TAccount;
  transferToAccount: TAccount;
  transferFromAddress: string;
  transferToAddress: string;
  transferAmount: string;
}

const initialState: WalletState = {
  transferType: 'transfer_in',
  transferFromAccount: {} as TAccount,
  transferToAccount: {} as TAccount,
  transferFromAddress: '',
  transferToAddress: '',
  transferAmount: '',
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setTransferType(state, { payload }: PayloadAction<TransferType>) {
      state.transferType = payload;
    },
    setTransferFromAccount: (state, { payload }: PayloadAction<TAccount>) => {
      if (!payload) return;
      state.transferFromAccount = payload;
      state.transferFromAddress = payload.address;
    },
    setTransferToAccount: (state, { payload }: PayloadAction<TAccount>) => {
      if (!payload) return;
      state.transferToAccount = payload;
      state.transferToAddress = payload.address;
    },
    setTransferFromAddress: (state, { payload }: PayloadAction<string>) => {
      state.transferFromAddress = payload;
    },
    setTransferToAddress: (state, { payload }: PayloadAction<string>) => {
      state.transferToAddress = payload;
    },
    setTransferAmount: (state, { payload }: PayloadAction<string>) => {
      state.transferAmount = payload;
    },
  },
});

export const {
  setTransferType,
  setTransferFromAccount,
  setTransferToAccount,
  setTransferFromAddress,
  setTransferToAddress,
  setTransferAmount,
} = walletSlice.actions;

export default walletSlice.reducer;
