import { getAccountStreamRecord, getPaymentAccount, getPaymentAccountsByOwner } from '@/facade/account';
import { StreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, GetState } from '..';

export type TAccount = {
  name: string;
  address: string;
}
export type TFullAccount = {
  name: string;
  address: string;
  bufferBalance?: string;
  frozenNetflowRate?: string;
  lockBalance?: string;
  netflowRate?: string;
  staticBalance?: string;
  crudTimestamp?: number;
  outFlowCount?: number;
  settleTimestamp?: number;
  status?: number;
  // only payment account have this field.
  refundable?: boolean;
};

interface AccountsState {
  isLoadingPAList: boolean;
  isLoadingDetail: string;
  ownerAccount: TAccount;
  PAList: TAccount[];
  currentPAPage: number;
  accountsInfo: Record<string, TFullAccount>;
  editOwnerDetail: string;
  editPaymentDetail: string;
  editDisablePaymentAccount: string;
}

const initialState: AccountsState = {
  isLoadingDetail: '',
  isLoadingPAList: false,
  currentPAPage: 0,
  ownerAccount: {} as TFullAccount,
  PAList: [],
  accountsInfo: {},
  editOwnerDetail: '',
  editPaymentDetail: '',
  editDisablePaymentAccount: '',
};

export const paymentAccountSlice = createSlice({
  name: 'accounts',
  initialState: () => {
    return { ...initialState };
  },

  reducers: {
    // TODO ownerAccount的static balance为0，跟实际获取到的balance不一致；
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
  },
});

export const {
  setLoadingDetail,
  setLoadingPAList,
  setOAList,
  setPAList,
  setPAInfos,
  setAccountsInfo,
  setEditOwnerDetail,
  setEditPaymentDetail,
  setEditDisablePaymentAccount,
  setCurrentPAPage,
} = paymentAccountSlice.actions;

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
  const { PAList } = getState().accounts;
  const  { loginAccount } = getState().persist;
  const accountList = [...PAList, {address:loginAccount, name: 'Owner Account' }]
  dispatch(setLoadingDetail(address));
  const [PARes, aError] = await getPaymentAccount(address);
  const [SRRes, error] = await getAccountStreamRecord(address);
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
