import {
  getStreamRecord,
  getPaymentAccount,
  getPaymentAccountsByOwner,
} from '@/facade/account';
import { StreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, GetState } from '..';
import { BN } from '@/utils/BigNumber';
import { getTimestampInSeconds } from '@/utils/time';
import { getClientFrozen } from '@/utils/payment';

export type TAccount = {
  name: string;
  address: string;
};
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
export type TBalance = {
  bankBalance: string;
  staticBalance: string;
};
interface AccountsState {
  isLoadingPaymentAccounts: boolean;
  isLoadingDetail: string;
  ownerAccount: TAccount;
  paymentAccounts: Record<string, TAccount[]>;
  currentPAPage: number;
  accountDetails: Record<string, TAccountDetail>;
  editOwnerDetail: string;
  editPaymentDetail: string;
  editDisablePaymentAccount: string;
  bankBalance: string;
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
  currentPAPage: 0,
  ownerAccount: {} as TAccountDetail,
  paymentAccounts: {},
  accountDetails: {},
  editOwnerDetail: '',
  editPaymentDetail: '',
  editDisablePaymentAccount: '',
  bankBalance: '',
};

export const paymentAccountSlice = createSlice({
  name: 'accounts',
  initialState: () => {
    return { ...initialState };
  },
  reducers: {
    setOwnerAccount: (state, { payload }: PayloadAction<TAccount>) => {
      state.ownerAccount = payload;
    },
    setPaymentAccounts: (state, { payload }: PayloadAction<{ loginAccount: string; paymentAccounts: string[] }>) => {
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
      }>,
    ) => {
      const { address, name, streamRecord } = payload;
      const curTimeInSeconds = getTimestampInSeconds();
      if (!address) return;
      if (!streamRecord) {
        state.accountDetails[address] = {
          ...getDefaultBalance(),
          name,
          address,
          refundable: payload.refundable,
        };
      } else {
        console.log('stream_record', streamRecord)
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
          clientFrozen: getClientFrozen(streamRecord.settleTimestamp.low),
          refundable: payload.refundable,
        };
      }
    },
    setEditOwnerDetail: (state, { payload }: PayloadAction<string>) => {
      state.editOwnerDetail = payload;
    },
    setEditPaymentDetail: (state, { payload }: PayloadAction<string>) => {
      state.editPaymentDetail = payload;
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
  setEditOwnerDetail,
  setEditPaymentDetail,
  setEditDisablePaymentAccount,
  setCurrentPAPage,
} = paymentAccountSlice.actions;

export const selectAccount = (address: string) => (state: any) =>
  (state.accounts.accountDetails[address] || {}) as TAccountDetail;
export const selectBankBalance = (address: string) => (state: any) =>
  state.accounts.bankBalances[address];
export const selectPaymentAccounts = (address: string) => (state: any) => state.accounts.paymentAccounts[address];
export const selectAvailableBalance = (address: string) => (state: any) => {
  const isOwnerAccount = address === state.persist.loginAccount;
  const accountDetail = state.accounts.accountDetails[address] as TAccountDetail;
  if (isOwnerAccount) {
    // TODO Use static balance on next version
    // return BN(state.accounts.bankBalance).plus(accountDetail.staticBalance).toString();
    return BN(state.accounts.bankBalance).toString();
  }

  return accountDetail?.staticBalance;
}
export const setupOAList = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const account = {
    address: loginAccount,
    name: 'Owner Account',
  };
  dispatch(setOwnerAccount(account));
  dispatch(setAccountDetail(account));
};

export const setupPaymentAccounts =
  (forceLoading = false) =>
    async (dispatch: any, getState: GetState) => {
      const { loginAccount } = getState().persist;
      const { paymentAccounts, isLoadingPaymentAccounts } = getState().accounts;
      if (isLoadingPaymentAccounts) return;
      if (!paymentAccounts.length || forceLoading) {
        dispatch(setLoadingPaymentAccounts(true));
      }
      const [data, error] = await getPaymentAccountsByOwner(loginAccount);
      dispatch(setLoadingPaymentAccounts(false));
      if (!data) return;
      const newData = data.paymentAccounts;
      dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: newData }));
      dispatch(setPAInfos({loginAccount}));
  };

export const setupAccountDetail =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;
    const paymentAccounts = getState().accounts.paymentAccounts[loginAccount] || [];
    const accountList = [...(paymentAccounts || []), { address: loginAccount, name: 'Owner Account' }];
    dispatch(setLoadingDetail(address));
    const [PARes, PAError] = await getPaymentAccount(address);
    const [SRRes, SRError] = await getStreamRecord(address);
    dispatch(setLoadingDetail(''));
    const paymentAccountName = accountList.find((item) => item.address === address)?.name || '';
    dispatch(
      setAccountDetail({
        address,
        name: paymentAccountName,
        streamRecord: SRRes?.streamRecord,
        refundable: PARes?.paymentAccount?.refundable,
      }),
    );
  };

export default paymentAccountSlice.reducer;
