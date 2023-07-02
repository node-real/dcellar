import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '@/store';
import { IReturnOffChainAuthKeyPairAndUpload } from '@bnb-chain/greenfield-chain-sdk';
import { updateSps } from '@/store/slices/sp';
import { getUtcZeroTimestamp } from '@/utils/time';
import { find } from 'lodash-es';

type OffChain = IReturnOffChainAuthKeyPairAndUpload;

export type SorterType = [string, 'descend' | 'ascend'];

export const getDefaultAccountConfig = (): PersistedAccountConfig => ({
  seedString: '',
  directDownload: false,
  directView: false,
  offchain: [] as Array<OffChain>,
  sps: Array<string>(),
});

export const defaultAccountConfig = getDefaultAccountConfig();

export type PersistedAccountConfig = {
  seedString: string;
  directDownload: boolean;
  directView: boolean;
  offchain: OffChain[];
  sps: Array<string>;
};

export interface PersistState {
  accounts: Record<string, PersistedAccountConfig>;
  loginAccount: string;
  faultySps: Array<string>;
  bucketSortBy: SorterType;
  bucketPageSize: number;
}

const initialState: PersistState = {
  accounts: {},
  loginAccount: '',
  faultySps: [],
  bucketSortBy: ['create_at', 'descend'],
  bucketPageSize: 20,
};

export const persistSlice = createSlice({
  name: 'persist',
  initialState,
  reducers: {
    updateBucketPageSize(state, { payload }: PayloadAction<number>) {
      state.bucketPageSize = payload;
    },
    updateBucketSorter(state, { payload }: PayloadAction<SorterType>) {
      state.bucketSortBy = payload;
    },
    setLogin(state, { payload }: PayloadAction<string>) {
      state.loginAccount = payload;
    },
    setLogout(state, { payload = false }: PayloadAction<boolean>) {
      if (payload) {
        const account = state.loginAccount;
        const config = state.accounts[account];
        state.accounts[account] = { ...config, offchain: [] };
      }
      state.loginAccount = '';
    },
    setAccountConfig(
      state,
      { payload }: PayloadAction<{ address: string; config: Partial<PersistedAccountConfig> }>,
    ) {
      const { address, config } = payload;
      const _config = state.accounts[address] || getDefaultAccountConfig();
      state.accounts[address] = { ..._config, ...config };
    },
    setOffchain(state, { payload }: PayloadAction<{ address: string; offchain: OffChain[] }>) {
      const { address, offchain } = payload;
      const _config = state.accounts[address] || getDefaultAccountConfig();
      state.accounts[address] = { ..._config, offchain };
    },
    setAccountSps(state, { payload }: PayloadAction<{ address: string; sps: string[] }>) {
      const { address, sps } = payload;
      const _config = state.accounts[address] || getDefaultAccountConfig();
      state.accounts[address] = { ..._config, sps };
    },
    setFaultySps(state, { payload }: PayloadAction<string[]>) {
      state.faultySps = payload;
    },
  },
});

export const selectAccountConfig = (address: string) => (state: AppState) =>
  state.persist.accounts[address] || defaultAccountConfig;

export const setupOffchain =
  (address: string, payload: IReturnOffChainAuthKeyPairAndUpload, needUpdate = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const sps = payload.spAddresses;
    const curTime = getUtcZeroTimestamp();
    const config = getState().persist.accounts[address] || getDefaultAccountConfig();
    const { sps: _sps } = getState().sp;
    const { offchain } = config;
    const legacyOffchain = offchain
      .map((o) => ({
        ...o,
        spAddresses: o.spAddresses.filter((s) => !sps.includes(s)),
      }))
      .filter((o) => o.spAddresses.length && o.expirationTime > curTime);
    // filter livable sps
    if (needUpdate) {
      const faultySps = _sps
        .filter((s) => !sps.includes(s.operatorAddress))
        .map((s) => s.operatorAddress);
      dispatch(setFaultySps(faultySps));
      dispatch(setAccountSps({ address, sps: _sps.map((s) => s.operatorAddress) }));
      dispatch(updateSps(sps));
    }
    dispatch(setOffchain({ address, offchain: [...legacyOffchain, payload] }));
  };

export const checkOffChainDataAvailable =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const config = getState().persist.accounts[address] || getDefaultAccountConfig();
    const { offchain } = config;
    if (!offchain.length) return false;
    const curTime = getUtcZeroTimestamp();
    return offchain.some((o) => o.expirationTime > curTime);
  };

export const getSpOffChainData =
  (address: string, sp: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const config = getState().persist.accounts[address] || getDefaultAccountConfig();
    const { offchain } = config;
    const curTime = getUtcZeroTimestamp();
    return (find<OffChain>(
      offchain,
      (o) => o.spAddresses.includes(sp) && o.expirationTime > curTime,
    ) || {}) as OffChain;
  };

export const checkSpOffChainDataAvailable =
  (address: string, sp: string) => async (dispatch: AppDispatch) => {
    return !!(await dispatch(getSpOffChainData(address, sp))).seedString;
  };

export const checkSpOffChainMayExpired =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const config = getState().persist.accounts[address] || getDefaultAccountConfig();
    const { sps: serverSps } = getState().sp;
    const { offchain, sps } = config;
    const curTime = getUtcZeroTimestamp();
    const mayExpired = offchain.some((sp) => sp.expirationTime < curTime + 60 * 60 * 24);
    const hasNewSp = serverSps.some((s) => !sps.includes(s.operatorAddress));
    return !offchain.length || mayExpired || hasNewSp;
  };

export const {
  updateBucketSorter,
  setLogin,
  setLogout,
  setAccountConfig,
  setOffchain,
  setAccountSps,
  setFaultySps,
  updateBucketPageSize,
} = persistSlice.actions;

export default persistSlice.reducer;
