import { StreamRecord as ChainStreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { StreamRecord as SpStreamRecord } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { keyBy } from 'lodash-es';
import { getSpOffChainData } from './persist';
import { AppDispatch, AppState, GetState } from '..';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import {
  getAccount,
  getPaymentAccount,
  getPaymentAccountsByOwner,
  getStreamRecord,
} from '@/facade/account';
import { listUserPaymentAccounts } from '@/facade/payment';
import { getShortAccountName } from '@/utils/billing';
import { BN } from '@/utils/math';
import { getClientFrozen } from '@/utils/payment';

export type AccountEntity = { id: string; name: string; address: string };

export type TempAccountEntity = { address: string; privateKey: string };

export function isSpStreamRecord(arg: ChainStreamRecord | SpStreamRecord): arg is SpStreamRecord {
  return (arg as SpStreamRecord).Account !== undefined;
}

export type AccountType =
  | 'unknown_account'
  | 'gnfd_account'
  | 'payment_account'
  | 'non_refundable_payment_account'
  | 'error_account';

export type AccountOperationsType = 'oaDetail' | 'paDetail' | 'paCreate' | '';

export type AccountInfo = AccountEntity & {
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

interface AccountsState {
  paymentAccountsLoading: boolean;
  accountInfoLoading: string;
  accountTypeLoading: boolean;
  ownerAccount: AccountEntity;
  paymentAccountListRecords: Record<string, AccountEntity[]>;
  paymentAccountListPage: number;
  accountRecords: Record<string, AccountInfo>;
  accountTypeRecords: Record<string, AccountType>;
  editingPaymentAccountRefundable: string;
  bankOrWalletBalance: string; // aka. bankBalance
  accountOperation: [string, AccountOperationsType];
  paymentAccountNetflowRateRecords: Record<string, string>;
  tempAccountRecords: Record<string, TempAccountEntity>;
}

const initialState: AccountsState = {
  accountInfoLoading: '',
  paymentAccountsLoading: false,
  accountTypeLoading: false,
  paymentAccountListPage: 0,
  ownerAccount: {} as AccountInfo,
  paymentAccountListRecords: {},
  accountRecords: {},
  accountTypeRecords: {},
  editingPaymentAccountRefundable: '',
  bankOrWalletBalance: '',
  accountOperation: ['', ''],
  paymentAccountNetflowRateRecords: {},
  tempAccountRecords: {},
};

export const paymentAccountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setAccountOperation(state, { payload }: PayloadAction<[string, AccountOperationsType]>) {
      state.accountOperation = payload;
    },
    setOwnerAccount: (state, { payload }: PayloadAction<AccountEntity>) => {
      state.ownerAccount = payload;
    },
    setPaymentAccountList: (
      state,
      { payload }: PayloadAction<{ loginAccount: string; paymentAccounts: string[] }>,
    ) => {
      const { loginAccount, paymentAccounts } = payload;
      state.paymentAccountListRecords[loginAccount] = (paymentAccounts || []).map(
        (account, index) => {
          return { name: `Payment Account ${index + 1}`, id: `pa${index + 1}`, address: account };
        },
      );
    },
    setAccountRecords: (
      state,
      {
        payload,
      }: PayloadAction<
        {
          address: string;
          name: string;
          streamRecord?: ChainStreamRecord | SpStreamRecord | undefined;
          refundable?: boolean;
          bufferTime: string;
        }[]
      >,
    ) => {
      const data = state.accountRecords;
      payload.forEach((item) => {
        const { address, name, streamRecord, bufferTime } = item;
        if (!address) return;

        if (!streamRecord) {
          data[address] = {
            ...getDefaultBalance(),
            name,
            id: getShortAccountName(name),
            address,
            refundable: item.refundable,
          };
        } else if (isSpStreamRecord(streamRecord)) {
          data[address] = {
            id: getShortAccountName(name),
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
            id: getShortAccountName(name),
            name: name,
            // ...streamRecord,
            address: address,
            staticBalance: BigNumber(streamRecord.staticBalance).div(1e18).toString(),
            bufferBalance: BigNumber(streamRecord.bufferBalance).div(1e18).toString(),
            lockBalance: BigNumber(streamRecord.lockBalance).div(1e18).toString(),
            netflowRate: BigNumber(streamRecord.netflowRate).div(1e18).toString(),
            crudTimestamp: Number(streamRecord.crudTimestamp?.low),
            outFlowCount: Number(streamRecord.outFlowCount?.low),
            settleTimestamp: Number(streamRecord.settleTimestamp?.low),
            clientFrozen: getClientFrozen(+streamRecord.settleTimestamp?.low, +bufferTime),
            frozenNetflowRate: streamRecord.frozenNetflowRate,
            refundable: item.refundable,
            status: streamRecord.status,
          };
        }
      });
      state.accountRecords = data;
    },
    setEditingPaymentAccountRefundable: (state, { payload }: PayloadAction<string>) => {
      state.editingPaymentAccountRefundable = payload;
    },
    setAccountEntityLoading: (state, { payload }: PayloadAction<string>) => {
      state.accountInfoLoading = payload;
    },
    setPaymentAccountsLoading: (state, { payload }: PayloadAction<boolean>) => {
      state.paymentAccountsLoading = payload;
    },
    setPaymentAccountListPage(state, { payload }: PayloadAction<number>) {
      state.paymentAccountListPage = payload;
    },
    setBankOrWalletBalance(state, { payload }: PayloadAction<string>) {
      state.bankOrWalletBalance = payload;
    },
    setAccountType(state, { payload }: PayloadAction<{ addr: string; type: AccountType }>) {
      const { addr, type } = payload;
      state.accountTypeRecords[addr] = type;
    },
    setPaymentAccountNetflowRate(
      state,
      { payload }: PayloadAction<{ loginAccount: string; totalNetflowRate: string }>,
    ) {
      const { loginAccount, totalNetflowRate } = payload;
      state.paymentAccountNetflowRateRecords[loginAccount] = totalNetflowRate;
    },
    setTempAccountRecords(state, { payload }: PayloadAction<TempAccountEntity>) {
      state.tempAccountRecords[payload.address] = payload;
    },
  },
});

export const {
  setAccountEntityLoading,
  setPaymentAccountsLoading,
  setOwnerAccount,
  setPaymentAccountList,
  setBankOrWalletBalance,
  setAccountRecords,
  setEditingPaymentAccountRefundable,
  setPaymentAccountListPage,
  setAccountType,
  setAccountOperation,
  setPaymentAccountNetflowRate,
  setTempAccountRecords,
} = paymentAccountSlice.actions;

const defaultAccountInfoAccount = {} as AccountInfo;
export const selectAccountDetail = (address: string) => (root: AppState) => {
  return root.accounts.accountRecords[address] || defaultAccountInfoAccount;
};

const defaultPaAccount = {} as AccountInfo;
export const selectAccount = (address: string) => (state: AppState) =>
  state.accounts.accountRecords[address] || defaultPaAccount;

export const defaultPAList = Array<AccountEntity>();
export const selectPaymentAccounts = (address: string) => (state: AppState) => {
  return state.accounts.paymentAccountListRecords[address] || defaultPAList;
};

export const defaultTempAccount = {} as TempAccountEntity;
export const selectTempAccountRecords = (address: string) => (state: AppState) => {
  return state.accounts.tempAccountRecords[address] || defaultTempAccount;
};

export const selectAvailableBalance = (address: string) => (state: AppState) => {
  const isOwnerAccount = address === state.persist.loginAccount;
  const accountDetail = state.accounts.accountRecords[address] as AccountInfo;
  if (isOwnerAccount) {
    // Use static balance on next version
    // return BN(state.accounts.bankBalance).plus(accountDetail.staticBalance).toString();
    return BN(state.accounts.bankOrWalletBalance).toString();
  }

  return accountDetail?.staticBalance;
};

export const setupPaymentAccounts =
  (forceLoading = false) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    const { loginAccount } = getState().persist;
    const { CLIENT_FROZEN_ACCOUNT_BUFFER_TIME } = getState().apollo;
    const { paymentAccountListRecords, paymentAccountsLoading } = getState().accounts;
    const { specifiedSp, spRecords } = getState().sp;
    const loginPaymentAccounts = paymentAccountListRecords[loginAccount] || [];

    if (paymentAccountsLoading) return;
    if (!(loginAccount in paymentAccountListRecords) || forceLoading) {
      dispatch(setPaymentAccountsLoading(true));
    }

    const [data, error] = await getPaymentAccountsByOwner(loginAccount);
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, specifiedSp));
    const [paDetail, paError] = await listUserPaymentAccounts(
      { account: loginAccount },
      { type: 'EDDSA', address: loginAccount, domain: window.location.origin, seed: seedString },
      { endpoint: spRecords[specifiedSp].endpoint },
    );

    if (error || paError || paDetail?.code !== 0) {
      dispatch(setPaymentAccountsLoading(false));
      dispatch(setPaymentAccountList({ loginAccount, paymentAccounts: [] }));
    }

    if (!data) {
      // for empty 404 loading
      if (!loginPaymentAccounts.length) {
        dispatch(setPaymentAccountsLoading(false));
        dispatch(setPaymentAccountList({ loginAccount, paymentAccounts: [] }));
      }
      return;
    }

    const keyAccountDetail = keyBy(
      paDetail?.body?.GfSpListUserPaymentAccountsResponse.PaymentAccounts,
      (item) => item.PaymentAccount.Address,
    );

    let totalPaymentAccountNetflowRate = BN(0);
    const newPaymentAccounts = data.paymentAccounts.map((address, index) => {
      const detail = keyAccountDetail[address];
      // Some PAs existed in the chain but are missing in the SP service.
      totalPaymentAccountNetflowRate = totalPaymentAccountNetflowRate.plus(
        BN(detail?.StreamRecord?.NetflowRate || 0).abs(),
      );

      return {
        name: `Payment Account ${index + 1}`,
        address,
        streamRecord: detail?.StreamRecord || {},
        refundable:
          detail?.PaymentAccount?.Refundable === undefined
            ? true
            : detail?.PaymentAccount?.Refundable,
        bufferTime: CLIENT_FROZEN_ACCOUNT_BUFFER_TIME,
      };
    });

    dispatch(
      setPaymentAccountNetflowRate({
        loginAccount,
        totalNetflowRate: totalPaymentAccountNetflowRate.dividedBy(10 ** 18).toString(),
      }),
    );
    dispatch(setPaymentAccountsLoading(false));
    dispatch(setPaymentAccountList({ loginAccount, paymentAccounts: data.paymentAccounts }));
    dispatch(setAccountRecords(newPaymentAccounts));
  };

export const setupAccountRecords =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;
    const paymentAccounts = getState().accounts.paymentAccountListRecords[loginAccount] || [];
    const { CLIENT_FROZEN_ACCOUNT_BUFFER_TIME } = getState().apollo;
    const accountList = [
      ...(paymentAccounts || []),
      { address: loginAccount, name: OWNER_ACCOUNT_NAME },
    ];

    dispatch(setAccountEntityLoading(address));
    const [PARes] = await getPaymentAccount(address);
    const [SRRes] = await getStreamRecord(address);
    dispatch(setAccountEntityLoading(''));

    const paymentAccountName = accountList.find((item) => item.address === address)?.name || '';
    const accountDetail = {
      address,
      name: paymentAccountName,
      streamRecord: SRRes?.streamRecord,
      refundable:
        !PARes || !PARes.paymentAccount || PARes.paymentAccount.refundable === undefined
          ? true
          : PARes?.paymentAccount?.refundable,
      bufferTime: CLIENT_FROZEN_ACCOUNT_BUFFER_TIME,
    };

    dispatch(setAccountRecords([accountDetail]));
  };

export const setupOwnerAccount = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const account = {
    address: loginAccount,
    name: OWNER_ACCOUNT_NAME,
    id: getShortAccountName(OWNER_ACCOUNT_NAME),
  };
  dispatch(setOwnerAccount(account));
  dispatch(setupAccountRecords(loginAccount));
};

export const setupAccountType =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    if (!address) return;
    const { loginAccount } = getState().persist;

    if (loginAccount === address) {
      return dispatch(setAccountType({ addr: address, type: 'gnfd_account' }));
    }

    const [PARes] = await getPaymentAccount(address);

    if (PARes) {
      const type =
        PARes?.paymentAccount.refundable === true
          ? 'payment_account'
          : 'non_refundable_payment_account';
      return dispatch(setAccountType({ addr: address, type }));
    }

    const [EARes] = await getAccount(address);

    if (EARes) {
      const type = 'gnfd_account';
      return dispatch(setAccountType({ addr: address, type }));
    }

    dispatch(setAccountType({ addr: address, type: 'unknown_account' }));
  };

export default paymentAccountSlice.reducer;
