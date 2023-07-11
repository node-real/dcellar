import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState } from '@/store';
import { getAccountBalance } from '@/facade/account';
import { getStreamRecord } from '@/facade/payment';

type Balance = {
  amount: string;
  denom: string;
  netflowRate: string;
  latestStaticBalance: string;
  lockFee: string;
  availableBalance: string;
  useMetamaskValue: boolean;
};

export const getDefaultBalance = () => ({
  amount: '0',
  denom: 'BNB',
  netflowRate: '0',
  latestStaticBalance: '0',
  lockFee: '0',
  availableBalance: '0',
  useMetamaskValue: false,
});

export const defaultBalance = getDefaultBalance();

export interface GlobalState {
  balances: Record<string, Balance>;
}

const initialState: GlobalState = {
  balances: {},
};

// DO NOT USE BALANCE SLICE DIRECTLY
export const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setBalance(state, { payload }: PayloadAction<{ address: string; balance: Partial<Balance> }>) {
      const { address, balance } = payload;
      const _config = state.balances[address];
      state.balances[address] = { ..._config, ...balance };
    },
    updateStaticBalance(state, { payload }: PayloadAction<{ address: string; offset: string }>) {
      const { address, offset } = payload;
      const pre = state.balances[address].latestStaticBalance;
      state.balances[address].latestStaticBalance = BigNumber(pre).plus(offset).toString();
    },
  },
});

export const { setBalance, updateStaticBalance } = balanceSlice.actions;

export const selectBalances = (state: AppState) => state.balance.balances;

export const selectBalance = (address: string) => (state: AppState) =>
  selectBalances(state)[address] || defaultBalance;

export const setupBalance =
  (address: string, metamaskValue = '0') =>
  async (dispatch: AppDispatch) => {
    const [balance, { netflowRate, latestStaticBalance, lockFee, useMetamaskValue }] =
      await Promise.all([getAccountBalance({ address }), getStreamRecord(address)]);
    const _amount = BigNumber(balance.amount).dividedBy(10 ** 18);
    const availableBalance = useMetamaskValue
      ? metamaskValue
      : _amount.plus(BigNumber.max(0, latestStaticBalance)).toString();

    const _balance = {
      ...balance,
      netflowRate,
      latestStaticBalance,
      lockFee,
      useMetamaskValue,
      availableBalance,
    };
    dispatch(setBalance({ address, balance: _balance }));
  };

export default balanceSlice.reducer;
