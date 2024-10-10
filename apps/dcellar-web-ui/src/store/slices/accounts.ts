import { StreamRecord as ChainStreamRecord } from '@bnb-chain/greenfield-cosmos-types/greenfield/payment/stream_record';
import { StreamRecord as SpStreamRecord } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { add, capitalize, isEmpty, keyBy } from 'lodash-es';
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

export enum EStreamRecordStatus {
  'ACTIVE' = 0,
  'FROZEN' = 1,
}

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
  accountInfos: Record<string, AccountInfo>;
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
  accountInfos: {},
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
    setAccountInfos: (
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
      const data = state.accountInfos;
      payload.forEach((item) => {
        const { address, name, streamRecord, bufferTime } = item;
        if (!address) return;

        if (isEmpty(streamRecord)) {
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
            frozenNetflowRate: BigNumber(streamRecord.FrozenNetflowRate).div(1e18).toString(),
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
            frozenNetflowRate: BigNumber(streamRecord.frozenNetflowRate).div(1e18).toString(),
            refundable: item.refundable,
            status: streamRecord.status,
          };
        }
      });
      state.accountInfos = data;
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
  setAccountInfos,
  setEditingPaymentAccountRefundable,
  setPaymentAccountListPage,
  setAccountType,
  setAccountOperation,
  setPaymentAccountNetflowRate,
  setTempAccountRecords,
} = paymentAccountSlice.actions;

const defaultPaAccount = {} as AccountInfo;
export const selectAccount = (address: string) => (state: AppState) =>
  state.accounts.accountInfos[address] || defaultPaAccount;

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
  const accountDetail = state.accounts.accountInfos[address] as AccountInfo;
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
    // const testAccounts = [
    //   //frozen owner account
    //   '0x6A69FAA1BD7D73D25A6A3EE1AE41A899DD8CCB8C',
    //   '0xCDB16F541E1445150F9211DD564668EB01B26E75',
    //   '0x40EDE296E01E1D57B25697B07D0F1C69077843D0',
    //   '0xCEE3823C39FCC9845D7C7144A836562F37995085',
    //   '0x1C893441AB6C1A75E01887087EA508BE8E07AAAE',
    //   // settime less than 7 days
    //   '0x367A4BD1606E97647F60DD15FECDCE4535B688F6',
    //   '0xB4ADFF34EF2C22A4B2FCAA7B955B9FB7BE414E6D',
    //   '0x78CFE6BCA29CEA13A6C3744D8B6AE86FB576940C',
    //   '0x9AEAC93ED1444D9E82E2C15F0FD42B0D791A3156',
    //   '0x3C1A11C54142C44E71A8302AD93AD0191FF17981',
    //   // // payment accounts
    //   // '0x4528E40060A22F347EA3BC7EDE62CEA29B5DD837',
    //   // '0x1745DEB31E405C4CB2C6747E2CFCECA6E57FF77A',
    //   // '0x258FC67F494A7F25692D02D918E99FA9B29FAEF3',
    //   // '0x48054722312D664E4C0ADE7FC0C5BD56701BA7D4',
    //   // '0xF00213234839FE91567E4FFE696A05A078CCF215',
    //   // '0xFFE7F0C98BB452CD4FA56E9FBE869E502E7186D4',
    //   // '0x08A8AF3666B39B35C429D8EBA2099B84B999160F',
    //   // '0xE9AB711EDBBCA0605D7E78E92B14C9D95A0E9D9F',
    //   // '0xC8B680FB0D2E5B4BEF28195D0D1EE070E271CD84'
    // ];
    const [paDetail, paError] = await listUserPaymentAccounts(
      { account: loginAccount },
      { type: 'EDDSA', address: loginAccount, domain: window.location.origin, seed: seedString },
      { endpoint: spRecords[specifiedSp].endpoint },
    );
    // const customDetail = await Promise.all(testAccounts.map(async (address) => {
    //   const [res, err] = await getStreamRecord(address);
    //   const [res2, err2] = await getAccount(address);
    //   console.log('stream_record', res?.streamRecord);
    //   console.log('account', res2);
    //   const StreamRecord = {};
    //   // const mapObj = {
    //   //   account: 'Account',
    //   //   bufferBalance: 'BufferBalance',
    //   //   crudtimestamp: 'CrudTimestamp',
    //   //   frozennetflowrate: 'FrozenNetflowRate',
    //   //   lockbalance: 'LockBalance',
    //   //   netflowrate: 'NetflowRate',
    //   //   outflowcount: 'OutflowCount',
    //   //   settletimestamp: 'SettleTimestamp',
    //   //   staticbalance: 'StaticBalance',
    //   //   status: 'Status',
    //   // }
    //   const capitalizeFirstLetter = (str) => {
    //     return str.charAt(0).toUpperCase() + str.slice(1);
    //   }
    //   Object.entries(res?.streamRecord || {}).map(([key, value]) => {
    //     StreamRecord[capitalizeFirstLetter(key)] = value.low ? value.low : value;
    //   });
    //   const PaymentAccount = {};
    //   Object.entries(res2 || {}).map(([key, value]) => {
    //     PaymentAccount[capitalizeFirstLetter(key)] = value
    //   });
    //   return {
    //     StreamRecord,
    //     PaymentAccount
    //   }
    // }
    // ))
    // console.log('customDetail', customDetail);
    // console.log('paDetail', paDetail);
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
    // const keyCustomDetail = keyBy(
    //   customDetail,
    //   (item) => item.StreamRecord.Account?.toLowerCase(),
    // );

    console.log('keyAccountDetail', keyAccountDetail);
    // console.log('keyCustomDetail', keyCustomDetail);
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
    dispatch(setAccountInfos(newPaymentAccounts));
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

    dispatch(setAccountInfos([accountDetail]));
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
