import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BnbPriceInfo, getDefaultBnbInfo, getBnbPrice } from '@/facade/common';
import { AppDispatch, AppState } from '@/store';
import { getAccountBalance } from '@/facade/account';
import { getStreamRecord } from '@/facade/payment';
import BigNumber from 'bignumber.js';
import { getClient } from '@/base/client';
import { QueryMsgGasParamsResponse } from '@bnb-chain/greenfield-cosmos-types/cosmos/gashub/v1beta1/query';
import { keyBy } from 'lodash-es';
import { gasRes } from './tmp';

type Balance = {
  amount: string;
  denom: string;
  netflowRate: string;
  latestStaticBalance: string;
  lockFee: string;
  availableBalance: string;
  useMetamaskValue: boolean;
};

type TGasList = {
  [msgTypeUrl: string]: {
    gasLimit: number;
    msgTypeUrl: string;
    gasFee: number;
  }
}

type TGas = {
  gasPrice: number;
  gasList: TGasList;
}

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
  bnb: BnbPriceInfo;
  balances: Record<string, Balance>;
  gasHub: TGas;
}

const initialState: GlobalState = {
  bnb: getDefaultBnbInfo(),
  balances: {},
  gasHub: {
    gasPrice: 5e-9,
    gasList: {},
  }
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
    setGasList(state, { payload }: PayloadAction<QueryMsgGasParamsResponse>) {
      const { gasPrice } = state.gasHub;
      const gasList = keyBy(payload.msgGasParams.map(item => {
        const gasLimit = item.fixedType?.fixedGas.low || 0;
        const gasFee = gasPrice * gasLimit;
        return {
          msgTypeUrl: item.msgTypeUrl,
          gasLimit,
          gasFee,
        }
      }), 'msgTypeUrl');

      state.gasHub.gasList = gasList;
    }
  },
});

export const { setBnbInfo, setBalance, updateStaticBalance } = globalSlice.actions;

export const selectBnbPrice = (state: AppState) => state.global.bnb.price;

export const selectBalances = (state: AppState) => state.global.balances;

export const selectBalance = (address: string) => (state: AppState) =>
  selectBalances(state)[address] || defaultBalance;

export const setupBnbPrice = () => async (dispatch: AppDispatch) => {
  const res = await getBnbPrice();
  dispatch(setBnbInfo(res));
};

export const setupGasList = () => async (dispatch: AppDispatch) => {
  const client = await getClient();
  // TODO recover it
  // const res = await client.gashub.getMsgGasParams({ msgTypeUrls: [] });
  // console.log('res', JSON.stringify(res));
  dispatch(globalSlice.actions.setGasList(gasRes));
}

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
