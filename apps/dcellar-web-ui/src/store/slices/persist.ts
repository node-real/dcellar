import { AppDispatch, AppState, GetState } from '@/store';
import { setNewAvailableSpList } from '@/store/slices/sp';
import { getTimestamp } from '@/utils/time';
import { IReturnOffChainAuthKeyPairAndUpload } from '@bnb-chain/greenfield-js-sdk';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
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
  accountRecords: Record<string, PersistedAccountConfig>;
  loginAccount: string;
  unAvailableSps: Array<string>;
  bucketSortBy: SorterType;
  objectSortBy: SorterType;
  groupSortBy: SorterType;
  groupPageSize: number;
  objectPageSize: number;
  bucketPageSize: number;
  paymentAccountPageSize: number;
  billPageSize: number;
  accountBillPageSize: number;
  paymentAccountSortBy: SorterType;
  isShowTutorialCard: boolean;
}

const initialState: PersistState = {
  accountRecords: {},
  loginAccount: '',
  unAvailableSps: [],
  bucketSortBy: ['CreateAt', 'descend'],
  bucketPageSize: 50,
  objectSortBy: ['createAt', 'descend'],
  objectPageSize: 50,
  groupSortBy: ['id', 'descend'],
  groupPageSize: 20,
  paymentAccountSortBy: ['account', 'ascend'],
  paymentAccountPageSize: 20,
  billPageSize: 20,
  accountBillPageSize: 20,
  isShowTutorialCard: true,
};

export const persistSlice = createSlice({
  name: 'persist',
  initialState,
  reducers: {
    setGroupSorter(state, { payload }: PayloadAction<SorterType>) {
      state.groupSortBy = payload;
    },
    setGroupListPageSize(state, { payload }: PayloadAction<number>) {
      state.groupPageSize = payload;
    },
    setObjectListPageSize(state, { payload }: PayloadAction<number>) {
      state.objectPageSize = payload;
    },
    setObjectSorter(state, { payload }: PayloadAction<SorterType>) {
      state.objectSortBy = payload;
    },
    setPaymentAccountSorter(state, { payload }: PayloadAction<SorterType>) {
      state.paymentAccountSortBy = payload;
    },
    setBucketListPageSize(state, { payload }: PayloadAction<number>) {
      state.bucketPageSize = payload;
    },
    setPaymentAccountListPageSize(state, { payload }: PayloadAction<number>) {
      state.paymentAccountPageSize = payload;
    },
    setBillPageSize(state, { payload }: PayloadAction<number>) {
      state.billPageSize = payload;
    },
    setAccountBillPageSize(state, { payload }: PayloadAction<number>) {
      state.accountBillPageSize = payload;
    },
    setBucketSorter(state, { payload }: PayloadAction<SorterType>) {
      state.bucketSortBy = payload;
    },
    setLoginAccount(state, { payload }: PayloadAction<string>) {
      state.loginAccount = payload;
    },
    setLogout(state, { payload = false }: PayloadAction<boolean>) {
      if (payload) {
        const account = state.loginAccount;
        const config = state.accountRecords[account];
        state.accountRecords[account] = { ...config, offchain: [] };
      }
      state.loginAccount = '';
    },
    setAccountConfig(
      state,
      { payload }: PayloadAction<{ address: string; config: Partial<PersistedAccountConfig> }>,
    ) {
      const { address, config } = payload;
      const _config = state.accountRecords[address] || getDefaultAccountConfig();
      state.accountRecords[address] = { ..._config, ...config };
    },
    setAccountOffchain(
      state,
      { payload }: PayloadAction<{ address: string; offchain: OffChain[] }>,
    ) {
      const { address, offchain } = payload;
      const _config = state.accountRecords[address] || getDefaultAccountConfig();
      state.accountRecords[address] = { ..._config, offchain };
    },
    setAccountSps(state, { payload }: PayloadAction<{ address: string; sps: string[] }>) {
      const { address, sps } = payload;
      const _config = state.accountRecords[address] || getDefaultAccountConfig();
      state.accountRecords[address] = { ..._config, sps };
    },
    setUnAvailableSps(state, { payload }: PayloadAction<string[]>) {
      state.unAvailableSps = payload;
    },
    setIsShowTutorialCard(state, { payload }: PayloadAction<boolean>) {
      state.isShowTutorialCard = payload;
    },
  },
});

export const {
  setBucketSorter,
  setLoginAccount,
  setLogout,
  setAccountConfig,
  setAccountOffchain,
  setAccountSps,
  setUnAvailableSps,
  setPaymentAccountSorter,
  setPaymentAccountListPageSize,
  setBucketListPageSize,
  setObjectSorter,
  setObjectListPageSize,
  setGroupSorter,
  setGroupListPageSize,
  setIsShowTutorialCard,
} = persistSlice.actions;

export const selectAccountConfig = (address: string) => (state: AppState) =>
  state.persist.accountRecords[address] || defaultAccountConfig;

export const setupOffchain =
  (address: string, payload: IReturnOffChainAuthKeyPairAndUpload, needUpdate = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const sps = payload.spAddresses;
    const curTime = getTimestamp();
    const config = getState().persist.accountRecords[address] || getDefaultAccountConfig();
    const { allSpList } = getState().sp;
    const { offchain } = config;
    const legacyOffchain = offchain
      .map((o) => ({
        ...o,
        spAddresses: o.spAddresses.filter((s) => !sps.includes(s)),
      }))
      .filter((o) => o.spAddresses.length && o.expirationTime > curTime);
    // filter livable sps
    if (needUpdate) {
      const unAvailableSps = allSpList
        .filter((s) => !sps.includes(s.operatorAddress))
        .map((s) => s.operatorAddress);
      dispatch(setUnAvailableSps(unAvailableSps));
      // persist all sps
      dispatch(setAccountSps({ address, sps: allSpList.map((s) => s.operatorAddress) }));
      dispatch(setNewAvailableSpList(sps));
    }
    dispatch(setAccountOffchain({ address, offchain: [...legacyOffchain, payload] }));
  };

export const getSpOffChainData =
  (address: string, spAddress: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const config = getState().persist.accountRecords[address] || getDefaultAccountConfig();
    const { offchain } = config;
    const curTime = getTimestamp();
    return (find<OffChain>(
      offchain,
      (o) => o.spAddresses.includes(spAddress) && o.expirationTime > curTime,
    ) || {}) as OffChain;
  };

export const checkOffChainDataAvailable =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const config = getState().persist.accountRecords[address] || getDefaultAccountConfig();
    const { offchain } = config;
    if (!offchain.length) return false;
    const curTime = getTimestamp();
    return offchain.some((o) => o.expirationTime > curTime);
  };

export const checkSpOffChainDataAvailable =
  (address: string, sp: string) => async (dispatch: AppDispatch) => {
    return !!(await dispatch(getSpOffChainData(address, sp))).seedString;
  };

export const checkSpOffChainMayExpired =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { accountRecords, unAvailableSps } = getState().persist;
    const config = accountRecords[address] || getDefaultAccountConfig();
    const allSpList = getState().sp.allSpList ?? [];
    const { offchain = [], sps = [] } = config;
    const curTime = getTimestamp();
    const mayExpired = offchain.some((sp) => sp.expirationTime < curTime + 60 * 60 * 24 * 1000);
    const hasNewSp = allSpList.some(
      (s) => !sps.includes(s.operatorAddress) && !unAvailableSps.includes(s.operatorAddress),
    );
    return !offchain.length || mayExpired || hasNewSp;
  };

export default persistSlice.reducer;
