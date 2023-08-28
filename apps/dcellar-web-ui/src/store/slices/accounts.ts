import { getAccountStreamRecord, getPaymentAccount, getPaymentAccountsByOwner } from '@/facade/account';
import { StreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, GetState } from '..';

export type TAccount = {
  name: string;
  address: string;
}
export type TAccountInfo = {
  name: string;
  address: string;
  bufferBalance: string;
  frozenNetflowRate: string;
  netflowRate: string;
  staticBalance: string;
  crudTimestamp: number;
  outFlowCount: number;
  settleTimestamp: number;
  status: number;
  lockBalance: string;
  refundable?: boolean;
};
export type TBalance = {
  bankBalance: string;
  staticBalance: string;
}
interface AccountsState {
  isLoadingPAList: boolean;
  isLoadingDetail: string;
  ownerAccount: TAccount;
  PAList: TAccount[];
  currentPAPage: number;
  accountsInfo: Record<string, TAccountInfo>;
  editOwnerDetail: string;
  editPaymentDetail: string;
  editDisablePaymentAccount: string;
  bankBalance: string;
}
export const getDefaultBalance = () => ({
  amount: '0',
  denom: 'BNB',
  bufferBalance: '0',
  frozenNetflowRate: '0',
  netflowRate: '0',
  staticBalance: '0',
  lockBalance: '0',
  crudTimestamp: 0,
  outFlowCount: 0,
  settleTimestamp: 0,
  status: 0,
  refundable: true,
  bankBalance: {},
});

const initialState: AccountsState = {
  isLoadingDetail: '',
  isLoadingPAList: false,
  currentPAPage: 0,
  ownerAccount: {} as TAccountInfo,
  PAList: [],
  accountsInfo: {},
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
    setOAList: (state, { payload }: PayloadAction<TAccount>) => {
      state.ownerAccount = payload;
    },
    setPAList: (state, { payload }: PayloadAction<{ paymentAccounts: string[] }>) => {
      const { paymentAccounts } = payload;
      state.PAList = (paymentAccounts || []).map((account, index) => {
        return {
          name: `Payment Account ${index + 1}`,
          address: account
        };
      });
    },
    setPAInfos: (state) => {
      const { PAList } = state;
      PAList.map((account, index) => {
        state.accountsInfo[account.address] = {
          ...state.accountsInfo[account.address],
          ...account,
        }
      });
    },
    setAccountsInfo: (state, { payload }: PayloadAction<{
      address: string;
      name: string;
      streamRecord?: StreamRecord | undefined;
      refundable?: boolean;
    }>) => {
      const { address, name, streamRecord } = payload;
      if (!address) return;
      if (!streamRecord) {
        state.accountsInfo[address] = {
          ...getDefaultBalance(),
          name,
          address,
          refundable: payload.refundable,
        }
      } else {
        state.accountsInfo[address] = {
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
    setLoadingPAList: (state, { payload }: PayloadAction<boolean>) => {
      state.isLoadingPAList = payload;
    },
    setCurrentPAPage(state, { payload }: PayloadAction<number>) {
      state.currentPAPage = payload;
    },
    setBankBalance(state, { payload }: PayloadAction<string>) {
      state.bankBalance = payload;
    }
  },
});

export const {
  setLoadingDetail,
  setLoadingPAList,
  setOAList,
  setPAList,
  setPAInfos,
  setBankBalance,
  setAccountsInfo,
  setEditOwnerDetail,
  setEditPaymentDetail,
  setEditDisablePaymentAccount,
  setCurrentPAPage,
} = paymentAccountSlice.actions;

export const selectAccount = (address: string) => (state: any) => state.accounts.accountsInfo[address];
export const selectBankBalance = (address: string) => (state: any) => state.accounts.bankBalances[address];

export const setupOAList = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const account = {
    address: loginAccount,
    name: 'Owner Account',
  }
  dispatch(setOAList(account))
  dispatch(setAccountsInfo(account))
};

export const setupPAList = () => async (dispatch: any, getState: GetState) => {
  const { loginAccount } = getState().persist;
  dispatch(setLoadingPAList(true));
  const [data, error] = await getPaymentAccountsByOwner(loginAccount);
  dispatch(setLoadingPAList(false));
  if (!data) return;
  const paymentAccounts = data.paymentAccounts;
  dispatch(setPAList({ paymentAccounts }));
  dispatch(setPAInfos());
}

export const setupAccountsInfo = (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
  if (!address) return;
  const { PAList } = getState().accounts;
  const  { loginAccount } = getState().persist;
  const accountList = [...PAList, {address:loginAccount, name: 'Owner Account' }]
  dispatch(setLoadingDetail(address));
  const [PARes, PAError] = await getPaymentAccount(address);
  const [SRRes, SRError] = await getAccountStreamRecord(address);
  dispatch(setLoadingDetail(''))
  const paymentAccountName =
    accountList.find((item) => item.address === address)?.name || '';
  dispatch(setAccountsInfo({
    address,
    name: paymentAccountName,
    streamRecord: SRRes?.streamRecord,
    refundable: PARes?.paymentAccount?.refundable,
  }));
}

export default paymentAccountSlice.reducer;
