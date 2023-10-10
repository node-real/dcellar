import {
  getStreamRecord,
  getPaymentAccount,
  getPaymentAccountsByOwner,
  getAccount,
} from '@/facade/account';
import { StreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState, GetState } from '..';
import { getClientFrozen } from '@/utils/payment';
import { BN } from '@/utils/math';

export type TAccount = {
  name: string;
  address: string;
};

export type AccountType =
  | 'unknown_account'
  | 'gnfd_account'
  | 'payment_account'
  | 'non_refundable_payment_account'
  | 'error_account';

export type AccountOperationsType = 'oaDetail' | 'paDetail' | 'paCreate' | '';

export type TAccountDetail = {
  name: string;
  address: string;
  bufferBalance: string;
  frozenNetflowRate: string;
  netflowRate: string;
  staticBalance: string;
  crudTimestamp: number;
  outFlowCount: number;
  settleTimestamp: number;
  clientFrozen: boolean;
  status: number;
  lockBalance: string;
  refundable?: boolean;
};

interface AccountsState {
  isLoadingPaymentAccounts: boolean;
  isLoadingDetail: string;
  isLoadingAccountType: boolean;
  ownerAccount: TAccount;
  paymentAccounts: Record<string, TAccount[]>;
  currentPAPage: number;
  accountDetails: Record<string, TAccountDetail>;
  accountTypes: Record<string, AccountType>;
  editDisablePaymentAccount: string;
  bankBalance: string;
  accountOperation: [string, AccountOperationsType];
}
export const getDefaultBalance = () => ({
  bufferBalance: '0',
  frozenNetflowRate: '0',
  netflowRate: '0',
  staticBalance: '0',
  lockBalance: '0',
  crudTimestamp: 0,
  outFlowCount: 0,
  settleTimestamp: 0,
  clientFrozen: false,
  status: 0,
  refundable: true,
  bankBalance: '',
});

const initialState: AccountsState = {
  isLoadingDetail: '',
  isLoadingPaymentAccounts: false,
  isLoadingAccountType: false,
  currentPAPage: 0,
  ownerAccount: {} as TAccountDetail,
  paymentAccounts: {},
  accountDetails: {},
  accountTypes: {},
  editDisablePaymentAccount: '',
  bankBalance: '',
  accountOperation: ['', ''],
};

export const paymentAccountSlice = createSlice({
  name: 'accounts',
  initialState: () => {
    return { ...initialState };
  },
  reducers: {
    setAccountOperation(state, { payload }: PayloadAction<[string, AccountOperationsType]>) {
      state.accountOperation = payload;
    },
    setOwnerAccount: (state, { payload }: PayloadAction<TAccount>) => {
      state.ownerAccount = payload;
    },
    setPaymentAccounts: (
      state,
      { payload }: PayloadAction<{ loginAccount: string; paymentAccounts: string[] }>,
    ) => {
      const { loginAccount, paymentAccounts } = payload;
      state.paymentAccounts[loginAccount] = (paymentAccounts || []).map((account, index) => {
        return {
          name: `Payment Account ${index + 1}`,
          address: account,
        };
      });
    },
    setPAInfos: (state, { payload }: PayloadAction<{ loginAccount: string }>) => {
      const { loginAccount } = payload;
      const { paymentAccounts } = state;
      const list = paymentAccounts[loginAccount];
      list.map((account, index) => {
        state.accountDetails[account.address] = {
          ...state.accountDetails[account.address],
          ...account,
        };
      });
    },
    setAccountDetail: (
      state,
      {
        payload,
      }: PayloadAction<{
        address: string;
        name: string;
        streamRecord?: StreamRecord | undefined;
        refundable?: boolean;
        bufferTime: string;
      }>,
    ) => {
      const { address, name, streamRecord, bufferTime } = payload;
      if (!address) return;
      if (!streamRecord) {
        state.accountDetails[address] = {
          ...getDefaultBalance(),
          name,
          address,
          refundable: payload.refundable,
        };
      } else {
        state.accountDetails[address] = {
          name: name,
          ...streamRecord,
          address: address,
          staticBalance: BigNumber(streamRecord.staticBalance).div(1e18).toString(),
          bufferBalance: BigNumber(streamRecord.bufferBalance).div(1e18).toString(),
          lockBalance: BigNumber(streamRecord.lockBalance).div(1e18).toString(),
          netflowRate: BigNumber(streamRecord.netflowRate).div(1e18).toString(),
          crudTimestamp: streamRecord.crudTimestamp.low,
          outFlowCount: streamRecord.outFlowCount.low,
          settleTimestamp: streamRecord.settleTimestamp.low,
          clientFrozen: getClientFrozen(streamRecord.settleTimestamp.low, +bufferTime),
          refundable: payload.refundable,
        };
      }
    },
    setEditDisablePaymentAccount: (state, { payload }: PayloadAction<string>) => {
      state.editDisablePaymentAccount = payload;
    },
    setLoadingDetail: (state, { payload }: PayloadAction<string>) => {
      state.isLoadingDetail = payload;
    },
    setLoadingPaymentAccounts: (state, { payload }: PayloadAction<boolean>) => {
      state.isLoadingPaymentAccounts = payload;
    },
    setCurrentPAPage(state, { payload }: PayloadAction<number>) {
      state.currentPAPage = payload;
    },
    setBankBalance(state, { payload }: PayloadAction<string>) {
      state.bankBalance = payload;
    },
    setAccountType(state, { payload }: PayloadAction<{ addr: string; type: AccountType }>) {
      const { addr, type } = payload;
      state.accountTypes[addr] = type;
    },
  },
});

export const {
  setLoadingDetail,
  setLoadingPaymentAccounts,
  setOwnerAccount,
  setPaymentAccounts,
  setPAInfos,
  setBankBalance,
  setAccountDetail,
  setEditDisablePaymentAccount,
  setCurrentPAPage,
  setAccountType,
  setAccountOperation,
} = paymentAccountSlice.actions;

const defaultPaAccount = {} as TAccountDetail;
export const selectAccount = (address: string) => (state: AppState) =>
  state.accounts.accountDetails[address] || defaultPaAccount;

export const defaultPAList = Array<TAccount>();
export const selectPaymentAccounts = (address: string) => (state: AppState) =>
  state.accounts.paymentAccounts[address] || defaultPAList;

export const selectAvailableBalance = (address: string) => (state: AppState) => {
  const isOwnerAccount = address === state.persist.loginAccount;
  const accountDetail = state.accounts.accountDetails[address] as TAccountDetail;
  if (isOwnerAccount) {
    // TODO Use static balance on next version
    // return BN(state.accounts.bankBalance).plus(accountDetail.staticBalance).toString();
    return BN(state.accounts.bankBalance).toString();
  }

  return accountDetail?.staticBalance;
};
export const setupOAList = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const { CLIENT_FROZEN__ACCOUNT_BUFFER_TIME } = getState().apollo;
  const account = {
    address: loginAccount,
    name: 'Owner Account',
  };
  dispatch(setOwnerAccount(account));
  dispatch(setAccountDetail({ ...account, bufferTime: CLIENT_FROZEN__ACCOUNT_BUFFER_TIME }));
};

export const setupPaymentAccounts =
  (forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { paymentAccounts, isLoadingPaymentAccounts } = getState().accounts;
    const loginPaymentAccounts = paymentAccounts[loginAccount] || [];
    if (isLoadingPaymentAccounts) return;
    if (!(loginAccount in paymentAccounts) || forceLoading) {
      dispatch(setLoadingPaymentAccounts(true));
    }
    const [data, error] = await getPaymentAccountsByOwner(loginAccount);
    dispatch(setLoadingPaymentAccounts(false));
    if (!data) {
      // todo for empty 404 loading
      if (!loginPaymentAccounts.length) {
        dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: [] }));
      }
      return;
    }
    const newData = data.paymentAccounts;
    dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: newData }));
    dispatch(setPAInfos({ loginAccount }));
  };

export const setupAccountDetail =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;
    const paymentAccounts = getState().accounts.paymentAccounts[loginAccount] || [];
    const { CLIENT_FROZEN__ACCOUNT_BUFFER_TIME } = getState().apollo;
    const accountList = [
      ...(paymentAccounts || []),
      { address: loginAccount, name: 'Owner Account' },
    ];
    dispatch(setLoadingDetail(address));
    const [PARes, PAError] = await getPaymentAccount(address);
    const [SRRes, SRError] = await getStreamRecord(address);
    dispatch(setLoadingDetail(''));
    const paymentAccountName = accountList.find((item) => item.address === address)?.name || '';
    const accountDetail = {
      address,
      name: paymentAccountName,
      streamRecord: SRRes?.streamRecord,
      refundable: PARes?.paymentAccount?.refundable,
    };
    dispatch(
      setAccountDetail({ ...accountDetail, bufferTime: CLIENT_FROZEN__ACCOUNT_BUFFER_TIME }),
    );
  };

export const setupAccountType =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;
    if (loginAccount === address) {
      return dispatch(
        setAccountType({
          addr: address,
          type: 'gnfd_account',
        }),
      );
    }
    const [PARes, PAError] = await getPaymentAccount(address);
    if (PARes) {
      const type =
        PARes?.paymentAccount.refundable === true
          ? 'payment_account'
          : 'non_refundable_payment_account';
      return dispatch(setAccountType({ addr: address, type }));
    }
    const [EARes, EAError] = await getAccount(address);
    if (EARes) {
      const type = 'gnfd_account';
      return dispatch(
        setAccountType({
          addr: address,
          type,
        }),
      );
    }
    dispatch(
      setAccountType({
        addr: address,
        type: 'unknown_account',
      }),
    );
  };
export default paymentAccountSlice.reducer;
