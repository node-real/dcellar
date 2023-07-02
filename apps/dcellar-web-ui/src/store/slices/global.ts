import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BnbPriceInfo, defaultBnbInfo, getBnbPrice } from '@/facade/common';
import { AppDispatch, AppState } from '@/store';
import { getAccountBalance } from '@/facade/account';
import { getStreamRecord } from '@/facade/payment';
import BigNumber from 'bignumber.js';
import amount from '@/modules/wallet/components/Amount';

type Balance = {
  amount: string;
  denom: string;
  netflowRate: string;
  latestStaticBalance: string;
  lockFee: string;
  availableBalance: string;
  useMetamaskValue: boolean;
};

export const defaultBalance = () => ({
  amount: '0',
  denom: 'BNB',
  netflowRate: '0',
  latestStaticBalance: '0',
  lockFee: '0',
  availableBalance: '0',
  useMetamaskValue: false,
});

export interface GlobalState {
  bnb: BnbPriceInfo;
  loginAccount: string;
  balances: Record<string, Balance>;
}

const initialState: GlobalState = {
  bnb: defaultBnbInfo(),
  loginAccount: '',
  balances: {},
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setBnbInfo(state, { payload }: PayloadAction<BnbPriceInfo>) {
      state.bnb = payload;
    },
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

export const { setBnbInfo, setBalance, updateStaticBalance } = globalSlice.actions;

export const selectBnbPrice = (state: AppState) => state.global.bnb.price;

export const selectBalance = (address: string) => (state: AppState) =>
  state.global.balances[address] || defaultBalance();

export const setupBnbPrice = () => async (dispatch: AppDispatch) => {
  const res = await getBnbPrice();
  dispatch(setBnbInfo(res));
};

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

export default globalSlice.reducer;
