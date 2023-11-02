import {
  getStreamRecord,
  getPaymentAccount,
  getPaymentAccountsByOwner,
  getAccount,
} from '@/facade/account';
import { StreamRecord as ChainStreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState, GetState } from '..';
import { getClientFrozen } from '@/utils/payment';
import { BN } from '@/utils/math';
import { listUserPaymentAccounts } from '@/facade/payment';
import { getSpOffChainData } from './persist';
import { keyBy } from 'lodash-es';
import { StreamRecord as SpStreamRecord } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { getPosDecimalValue } from '@/utils/wallet';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';

export type TAccount = {
  name: string;
  address: string;
};

export function isSpStreamRecord (arg: ChainStreamRecord | SpStreamRecord): arg is SpStreamRecord {
  return (arg as SpStreamRecord).Account !== undefined;
}
export type AccountType =
  | 'unknown_account'
  | 'gnfd_account'
  | 'payment_account'
  | 'non_refundable_payment_account'
  | 'error_account';

export type AccountOperationsType = 'oaDetail' | 'paDetail' | 'paCreate' | '';

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
  clientFrozen: boolean;
  status: number;
  lockBalance: string;
  refundable?: boolean;
};

interface AccountsState {
  isLoadingPaymentAccounts: boolean;
  isLoadingAccountInfo: string;
  isLoadingAccountType: boolean;
  ownerAccount: TAccount;
  paymentAccounts: Record<string, TAccount[]>;
  currentPAPage: number;
  accountInfo: Record<string, TAccountInfo>;
  accountTypes: Record<string, AccountType>;
  editDisablePaymentAccount: string;
  bankBalance: string;
  accountOperation: [string, AccountOperationsType];
  totalPANetflowRate: Record<string, string>;
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
  isLoadingAccountInfo: '',
  isLoadingPaymentAccounts: false,
  isLoadingAccountType: false,
  currentPAPage: 0,
  ownerAccount: {} as TAccountInfo,
  paymentAccounts: {},
  accountInfo: {},
  accountTypes: {},
  editDisablePaymentAccount: '',
  bankBalance: '',
  accountOperation: ['', ''],
  totalPANetflowRate: {},
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
    setAccountInfo: (
      state,
      {
        payload,
      }: PayloadAction<{
        address: string;
        name: string;
        streamRecord?: ChainStreamRecord | SpStreamRecord | undefined;
        refundable?: boolean;
        bufferTime: string;
      }[]>,
    ) => {
      const data = state.accountInfo;
      payload.forEach((item) => {
        const { address, name, streamRecord, bufferTime } = item;
        if (!address) return;
        if (!streamRecord) {
          data[address] = {
            ...getDefaultBalance(),
            name,
            address,
            refundable: item.refundable,
          };
        } else if (isSpStreamRecord(streamRecord)) {
          data[address] = {
            name: name,
            // ...streamRecord,
            address: address,
            staticBalance: BigNumber(streamRecord.StaticBalance).div(1e18).toString(),
            bufferBalance: BigNumber(streamRecord.BufferBalance).div(1e18).toString(),
            lockBalance: BigNumber(streamRecord.LockBalance).div(1e18).toString(),
            netflowRate: BigNumber(streamRecord.NetflowRate).div(1e18).toString(),
            crudTimestamp: Number(streamRecord.CrudTimestamp),
            outFlowCount: Number(streamRecord.OutFlowCount),
            settleTimestamp: Number(streamRecord.SettleTimestamp),
            clientFrozen: getClientFrozen(+streamRecord.SettleTimestamp, +bufferTime),
            frozenNetflowRate: streamRecord.FrozenNetflowRate,
            refundable: item.refundable,
            status: Number(streamRecord.Status),
          };
        } else {
          data[address] = {
            name: name,
            // ...streamRecord,
            address: address,
            staticBalance: BigNumber(streamRecord.staticBalance).div(1e18).toString(),
            bufferBalance: BigNumber(streamRecord.bufferBalance).div(1e18).toString(),
            lockBalance: BigNumber(streamRecord.lockBalance).div(1e18).toString(),
            netflowRate: BigNumber(streamRecord.netflowRate).div(1e18).toString(),
            crudTimestamp: Number(streamRecord.crudTimestamp.low),
            outFlowCount: Number(streamRecord.outFlowCount.low),
            settleTimestamp: Number(streamRecord.settleTimestamp.low),
            clientFrozen: getClientFrozen(+streamRecord.settleTimestamp.low, +bufferTime),
            frozenNetflowRate: streamRecord.frozenNetflowRate,
            refundable: item.refundable,
            status: streamRecord.status,
          }
        }
      });
      state.accountInfo = data;
    },
    setEditDisablePaymentAccount: (state, { payload }: PayloadAction<string>) => {
      state.editDisablePaymentAccount = payload;
    },
    setLoadingAccountInfo: (state, { payload }: PayloadAction<string>) => {
      state.isLoadingAccountInfo = payload;
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
    setTotalPANetflowRate(state, { payload }: PayloadAction<{ loginAccount: string; totalNetflowRate: string }>) {
      const { loginAccount, totalNetflowRate } = payload;
      state['totalPANetflowRate'][loginAccount] = totalNetflowRate
    }
  },
});

export const {
  setLoadingAccountInfo,
  setLoadingPaymentAccounts,
  setOwnerAccount,
  setPaymentAccounts,
  setBankBalance,
  setAccountInfo,
  setEditDisablePaymentAccount,
  setCurrentPAPage,
  setAccountType,
  setAccountOperation,
  setTotalPANetflowRate,
} = paymentAccountSlice.actions;
const defaultAccountInfoAccount = {} as TAccountInfo;
export const selectAccountDetail = (address: string) => (root: AppState) => {
  return root.accounts.accountInfo[address] || defaultAccountInfoAccount
}

const defaultPaAccount = {} as TAccountInfo;
export const selectAccount = (address: string) => (state: AppState) =>
  state.accounts.accountInfo[address] || defaultPaAccount;

export const defaultPAList = Array<TAccount>();
export const selectPaymentAccounts = (address: string) => (state: AppState) => {
  return state.accounts.paymentAccounts[address] || defaultPAList;
}

export const selectAvailableBalance = (address: string) => (state: AppState) => {
  const isOwnerAccount = address === state.persist.loginAccount;
  const accountDetail = state.accounts.accountInfo[address] as TAccountInfo;
  if (isOwnerAccount) {
    // TODO Use static balance on next version
    // return BN(state.accounts.bankBalance).plus(accountDetail.staticBalance).toString();
    return BN(state.accounts.bankBalance).toString();
  }

  return accountDetail?.staticBalance;
};

export const setupPaymentAccounts =
  (forceLoading = false) =>
    async (dispatch: AppDispatch, getState: GetState) => {
      const { loginAccount } = getState().persist;
      const { CLIENT_FROZEN__ACCOUNT_BUFFER_TIME } = getState().apollo;
      const { paymentAccounts, isLoadingPaymentAccounts } = getState().accounts;
      const { oneSp } = getState().sp
      const loginPaymentAccounts = paymentAccounts[loginAccount] || [];
      if (isLoadingPaymentAccounts) return;
      if (!(loginAccount in paymentAccounts) || forceLoading) {
        dispatch(setLoadingPaymentAccounts(true));
      }
      const [data, error] = await getPaymentAccountsByOwner(loginAccount);
      const { seedString } = await dispatch(getSpOffChainData(loginAccount, oneSp));
      const [paDetail, paError] = await listUserPaymentAccounts({
        account: loginAccount
      }, {
        type: 'EDDSA',
        address: loginAccount,
        domain: window.location.origin,
        seed: seedString
      });

      if (error || paError || paDetail?.code !== 0) {
        dispatch(setLoadingPaymentAccounts(false));
        dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: [] }));
      }
      if (!data) {
        // todo for empty 404 loading
        if (!loginPaymentAccounts.length) {
          dispatch(setLoadingPaymentAccounts(false));
          dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: [] }));
        }
        return;
      }
      const keyAccountDetail = keyBy(paDetail?.body?.GfSpListUserPaymentAccountsResponse.PaymentAccounts, (item) => {
        return item.PaymentAccount.Address
      });
      let totalPANetflowRate = BN(0);
      const newPAs = data.paymentAccounts.map((address, index) => {
        const detail = keyAccountDetail[address];
        totalPANetflowRate = totalPANetflowRate.plus(BN(detail.StreamRecord.NetflowRate).abs())
        return {
          name: `Payment Account ${index + 1}`,
          address,
          streamRecord: detail.StreamRecord,
          refundable: detail.PaymentAccount.Refundable,
          bufferTime: CLIENT_FROZEN__ACCOUNT_BUFFER_TIME
        }
      });
      dispatch(setTotalPANetflowRate({loginAccount, totalNetflowRate: totalPANetflowRate.dividedBy(10 ** 18).toString()}))
      dispatch(setLoadingPaymentAccounts(false));
      dispatch(setPaymentAccounts({ loginAccount, paymentAccounts: data.paymentAccounts }));
      dispatch(setAccountInfo(newPAs))
    };

export const setupAccountInfo =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;
    const paymentAccounts = getState().accounts.paymentAccounts[loginAccount] || [];
    const { CLIENT_FROZEN__ACCOUNT_BUFFER_TIME } = getState().apollo;
    const accountList = [
      ...(paymentAccounts || []),
      { address: loginAccount, name: 'Owner Account' },
    ];
    dispatch(setLoadingAccountInfo(address));
    const [PARes, PAError] = await getPaymentAccount(address);
    const [SRRes, SRError] = await getStreamRecord(address);
    dispatch(setLoadingAccountInfo(''));
    const paymentAccountName = accountList.find((item) => item.address === address)?.name || '';
    const accountDetail = {
      address,
      name: paymentAccountName,
      streamRecord: SRRes?.streamRecord,
      refundable: !PARes || !PARes.paymentAccount || PARes.paymentAccount.refundable === undefined ? true : PARes?.paymentAccount?.refundable,
      bufferTime: CLIENT_FROZEN__ACCOUNT_BUFFER_TIME,
    };

    dispatch(
      setAccountInfo([accountDetail]),
    );
  };

export const setupOwnerAccount = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const account = {
    address: loginAccount,
    name: 'Owner Account',
  };
  dispatch(setOwnerAccount(account));
  dispatch(setupAccountInfo(loginAccount));
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
