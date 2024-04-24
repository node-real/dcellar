import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { isEmpty, keyBy } from 'lodash-es';
import { AppDispatch, AppState, GetState } from '..';
import {
  getMonthlyBillByAddress,
  GetMonthlyBillByAddressParams,
  GetMonthlyBillByAddressResponse,
  getMonthlyBillByOwner,
  GetMonthlyBillByOwnerParams,
  GetMonthlyBillByOwnerResponse,
  getRealTimeBillByAddress,
  GetRealTimeBillByAddressCountParams,
  GetRealTimeBillByOwnerCountParams,
  getRealTimeBillCountByAddress,
  getRealTimeBillCountByOwner,
  GetRealTimeBillListByAddressParams,
  GetRealTimeBillListByAddressResponse,
  getRealTimeBillListByOwner,
  GetRealTimeBillListByOwnerParams,
  getTotalCostByOwner,
  RawMonthlyBill,
} from '@/facade/billing';
import { FULL_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { BN } from '@/utils/math';
import { getUtcDayjs } from '@/utils/time';
import { getPosDecimalValue } from '@/utils/wallet';
import { toast } from '@node-real/uikit';

type AccountCost = { address: string; cost: string };

export type CostInfo = { totalCost: string; detailCosts: AccountCost[] };

export type DetailBill = {
  address: string;
  time: string;
  totalCost: string;
  readCost: string;
  storeCost: string;
};

export type MonthlyCost = {
  time: string;
  month: string;
  totalCost: string;
  readCost: string;
  storeCost: string;
  detailBills: DetailBill[];
};

export type CostTrend = {
  startTime: string;
  endTime: string;
  readCost: string;
  storeCost: string;
  totalCost: string;
  monthlyCost: { [key: string]: MonthlyCost };
};

export type AccountCostMonth = {
  address: string;
  time: string;
  totalCost: string;
  readCost: string;
  storeCost: string;
};

export type AccountCostTrend = {
  startTime: string;
  endTime: string;
  totalCost: string;
  monthlyCost: { [key: string]: AccountCostMonth };
};

export type AccountBill = {
  address: string;
  timestamp: number;
  readCost: string;
  storeCost: string;
  totalCost: string;
  balance: string;
  txHash: string;
  txType: string;
};

interface BillingState {
  billListPage: number;
  accountBillListPage: number;
  costLoading: boolean;
  costTrendLoading: boolean;
  accountCostTrendLoading: boolean;
  accountBillListLoading: boolean;
  billListLoading: boolean;
  costRecords: Record<string, CostInfo>;
  costTrendRecords: Record<string, CostTrend>;
  accountCostTrendRecords: Record<string, AccountCostTrend>;
  monthTotalCost: string;
  accountBillsCountRecords: Record<string, number>;
  accountBillListRecords: Record<string, AccountBill[]>;
  billsCountRecords: Record<string, number>;
  billListRecords: Record<string, AccountBill[]>;
  billRangeFilter: [string, string];
  billTypeFilter: Array<string>;
  billAccountFilter: Array<string>;
  accountBillRangeFilter: [string, string];
  accountBillTypeFilter: Array<string>;
}

const initialState: BillingState = {
  billListPage: 1,
  accountBillListPage: 1,
  costLoading: false,
  costTrendLoading: false,
  accountCostTrendLoading: false,
  accountBillListLoading: false,
  billListLoading: false,
  costRecords: {},
  costTrendRecords: {},
  accountCostTrendRecords: {},
  monthTotalCost: '',
  accountBillsCountRecords: {},
  accountBillListRecords: {},
  billsCountRecords: {},
  billListRecords: {},
  billRangeFilter: ['', ''],
  billTypeFilter: [],
  billAccountFilter: [],
  accountBillRangeFilter: ['', ''],
  accountBillTypeFilter: [],
};

export const billingSlice = createSlice({
  name: 'billing',
  initialState: initialState,
  reducers: {
    setTotalCost: (
      state,
      { payload }: PayloadAction<{ loginAccount: string; accountCosts: AccountCost[] }>,
    ) => {
      const { loginAccount, accountCosts } = payload;

      const detailCosts = accountCosts.map((item) => ({
        ...item,
        cost: BN(getPosDecimalValue(item.cost)).abs().toString(),
      }));

      const totalCost = getPosDecimalValue(
        accountCosts.reduce((pre, cur) => BN(pre).plus(cur.cost), BN(0)).abs(),
      );

      state.costRecords[loginAccount] = { totalCost, detailCosts };
    },
    setCurMonthTotalCosted: (
      state,
      { payload }: PayloadAction<{ bills: RawMonthlyBill[] | undefined }>,
    ) => {
      const { bills } = payload;
      if (!bills) {
        state.monthTotalCost = '0';
        return;
      }
      state.monthTotalCost = getPosDecimalValue(
        bills.reduce((pre, cur) => BN(pre).plus(cur.TotalCost), BN(0)).abs(),
      );
    },
    setAllCostTrend: (
      state,
      {
        payload,
      }: PayloadAction<{
        loginAccount: string;
        startTime: string;
        endTime: string;
        monthlyBills: GetMonthlyBillByOwnerResponse;
      }>,
    ) => {
      const dayjs = getUtcDayjs();
      const { startTime, endTime, loginAccount, monthlyBills } = payload;
      let allCostTrend = { monthlyCost: {} } as CostTrend;
      let allTotalCost = BN(0);
      let allTotalReadCost = BN(0);
      let allTotalStoreCost = BN(0);

      monthlyBills.forEach((item) => {
        const key = item.bills[0].Year + '-' + item.bills[0].Month;
        if (allCostTrend['monthlyCost'][key]) {
          allCostTrend['monthlyCost'][key] = {} as MonthlyCost;
        }
        let monthlyTotalCost = BN(0);
        let monthlyTotalReadCost = BN(0);
        let monthlyTotalStoreCost = BN(0);

        const detailBills = item.bills
          .map((bill) => {
            monthlyTotalCost = monthlyTotalCost.plus(bill.TotalCost);
            monthlyTotalReadCost = monthlyTotalReadCost.plus(bill.ReadCost);
            monthlyTotalStoreCost = monthlyTotalStoreCost.plus(bill.StoreCost);
            return {
              address: bill.Address,
              time: bill.Year + '-' + bill.Month,
              readCost: getPosDecimalValue(bill.ReadCost),
              storeCost: getPosDecimalValue(bill.StoreCost),
              totalCost: getPosDecimalValue(bill.TotalCost),
            };
          })
          .sort((a, b) => BN(b.totalCost).comparedTo(a.totalCost));

        allTotalCost = allTotalCost.plus(monthlyTotalCost);
        allTotalReadCost = allTotalReadCost.plus(monthlyTotalReadCost);
        allTotalStoreCost = allTotalStoreCost.plus(monthlyTotalStoreCost);
        allCostTrend.monthlyCost[key] = {
          time: key,
          month: dayjs(key).format('MMM'),
          totalCost: getPosDecimalValue(monthlyTotalCost),
          readCost: getPosDecimalValue(monthlyTotalReadCost),
          storeCost: getPosDecimalValue(monthlyTotalStoreCost),
          detailBills: detailBills || [],
        };
      });

      allCostTrend = {
        ...allCostTrend,
        totalCost: getPosDecimalValue(allTotalCost),
        readCost: getPosDecimalValue(allTotalReadCost),
        storeCost: getPosDecimalValue(allTotalStoreCost),
        startTime,
        endTime,
      };
      state.costTrendRecords[loginAccount] = allCostTrend;
    },
    setAccountCostTrend: (
      state,
      {
        payload,
      }: PayloadAction<{
        address: string;
        startTime: string;
        endTime: string;
        monthlyBills: GetMonthlyBillByAddressResponse;
      }>,
    ) => {
      const { startTime, endTime, address, monthlyBills } = payload;
      const data = {} as { [key: string]: AccountCostMonth };
      let accountTotalCost = BN(0);

      monthlyBills.forEach((item) => {
        const key = item.Year + '-' + item.Month;
        data[key] = {
          time: key,
          address: item.Address,
          totalCost: getPosDecimalValue(item.TotalCost),
          readCost: getPosDecimalValue(item.ReadCost),
          storeCost: getPosDecimalValue(item.StoreCost),
        };
        accountTotalCost = accountTotalCost.plus(getPosDecimalValue(item.TotalCost));
      });

      state.accountCostTrendRecords[address] = {
        startTime,
        endTime,
        totalCost: accountTotalCost.toString(),
        monthlyCost: data,
      };
    },

    setLoadingAllCost: (state, { payload }: PayloadAction<boolean>) => {
      state.costLoading = payload;
    },
    setLoadingAllCostTrend: (state, { payload }: PayloadAction<boolean>) => {
      state.costTrendLoading = payload;
    },
    setLoadingAccountCostTrend: (state, { payload }: PayloadAction<boolean>) => {
      state.accountCostTrendLoading = payload;
    },
    setAccountBillsCount: (
      state,
      { payload }: PayloadAction<{ address: string; count: number }>,
    ) => {
      const { address, count } = payload;
      state.accountBillsCountRecords[address] = count;
    },
    setAccountBills: (
      state,
      { payload }: PayloadAction<{ address: string; bills: GetRealTimeBillListByAddressResponse }>,
    ) => {
      const dayjs = getUtcDayjs();
      const { address, bills } = payload;

      state.accountBillListRecords[address] = (bills || []).map((item) => ({
        address: item.Address,
        timestamp: dayjs(item.Timestamp).valueOf(),
        readCost: getPosDecimalValue(item.ReadCost, FULL_DISPLAY_PRECISION),
        storeCost: getPosDecimalValue(item.StoreCost, FULL_DISPLAY_PRECISION),
        totalCost: getPosDecimalValue(item.TotalCost, FULL_DISPLAY_PRECISION),
        balance: getPosDecimalValue(item.Balance, FULL_DISPLAY_PRECISION),
        txHash: item.TxHash,
        txType: item.TxType,
      }));
    },
    setAllBillsCount: (
      state,
      { payload }: PayloadAction<{ loginAccount: string; count: number }>,
    ) => {
      const { loginAccount, count } = payload;
      state.billsCountRecords[loginAccount] = count;
    },
    setAllBills: (
      state,
      {
        payload,
      }: PayloadAction<{ loginAccount: string; bills: GetRealTimeBillListByAddressResponse }>,
    ) => {
      const dayjs = getUtcDayjs();
      const { loginAccount, bills } = payload;

      state.billListRecords[loginAccount] = (bills || []).map((item) => ({
        address: item.Address,
        timestamp: dayjs(item.Timestamp).valueOf(),
        readCost: getPosDecimalValue(item.ReadCost, FULL_DISPLAY_PRECISION),
        storeCost: getPosDecimalValue(item.StoreCost, FULL_DISPLAY_PRECISION),
        totalCost: getPosDecimalValue(item.TotalCost, FULL_DISPLAY_PRECISION),
        balance: getPosDecimalValue(item.Balance, FULL_DISPLAY_PRECISION),
        txHash: item.TxHash,
        txType: item.TxType,
      }));
    },
    setCurrentAllBillsPage(state, { payload }: PayloadAction<number>) {
      state.billListPage = payload;
    },
    setCurrentAccountBillsPage(state, { payload }: PayloadAction<number>) {
      state.accountBillListPage = payload;
    },
    setLoadingAccountBills: (state, { payload }: PayloadAction<boolean>) => {
      state.accountBillListLoading = payload;
    },
    setLoadingAllBills: (state, { payload }: PayloadAction<boolean>) => {
      state.billListLoading = payload;
    },
    setAllFilterRange(state, { payload }: PayloadAction<[string, string]>) {
      state.billRangeFilter = payload;
    },
    setAllFilterTypes(state, { payload }: PayloadAction<string[]>) {
      state.billTypeFilter = payload;
    },
    setAllFilterAccounts(state, { payload }: PayloadAction<string[]>) {
      state.billAccountFilter = payload;
    },
    setAccountFilterRange(state, { payload }: PayloadAction<[string, string]>) {
      state.accountBillRangeFilter = payload;
    },
    setAccountFilterTypes(state, { payload }: PayloadAction<string[]>) {
      state.accountBillTypeFilter = payload;
    },
    resetAllHistoryFilter(state) {
      state.billTypeFilter = [];
      state.billRangeFilter = ['', ''];
    },
    resetAccountHistoryFilter(state) {
      state.accountBillTypeFilter = [];
      state.accountBillRangeFilter = ['', ''];
    },
  },
});

export const {
  setTotalCost,
  setCurMonthTotalCosted,
  setAllCostTrend,
  setAccountCostTrend,
  setLoadingAllCostTrend,
  setLoadingAccountCostTrend,
  setAccountBillsCount,
  setAccountBills,
  setCurrentAllBillsPage,
  setCurrentAccountBillsPage,
  setLoadingAccountBills,
  setAllBills,
  setAllBillsCount,
  setLoadingAllBills,
  setLoadingAllCost,
  setAllFilterRange,
  setAllFilterTypes,
  setAllFilterAccounts,
  setAccountFilterRange,
  setAccountFilterTypes,
} = billingSlice.actions;

export const defaultAllCost = {} as CostInfo;
export const selectAllCost = (address: string) => (root: AppState) => {
  return root.billing.costRecords[address] || defaultAllCost;
};

export const defaultAllCostTrend = {} as CostTrend;
export const selectAllCostTrend = (address: string) => (root: AppState) => {
  return root.billing.costTrendRecords[address] || defaultAllCostTrend;
};

export const selectAccountCostTrend = (address: string) => (root: AppState) => {
  if (!address) return {} as AccountCostTrend;
  return root.billing.accountCostTrendRecords[address];
};

export const defaultAccountBills = [] as AccountBill[];
export const selectAccountBills = (address: string) => (root: AppState) => {
  return root.billing.accountBillListRecords[address] || defaultAccountBills;
};

export const selectAccountBillsCount = (address: string) => (root: AppState) => {
  return root.billing.accountBillsCountRecords[address] || 0;
};

export const defaultBills = [] as AccountBill[];
export const selectAllBills = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.billing.billListRecords[loginAccount] || defaultBills;
};

export const selectAllBillsCount = () => (root: AppState) => {
  const loginAccount = root.persist.loginAccount;
  return root.billing.billsCountRecords[loginAccount] || 0;
};

export const setupTotalCost = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  // Because billing data refresh time is six hours, so we don't need to refresh it every time.
  const { costRecords } = getState().billing;
  const existedCost = costRecords[loginAccount];
  if (existedCost) return;

  dispatch(setLoadingAllCost(true));
  const [data, error] = await getTotalCostByOwner(loginAccount);
  if (!data || error) {
    dispatch(setLoadingAllCost(false));
    return error;
  }
  const accountCosts = data.map((item) => ({
    address: item.Address,
    cost: item.Cost,
  }));
  dispatch(setLoadingAllCost(false));
  dispatch(setTotalCost({ loginAccount, accountCosts }));
};

export const setupAllCostTrend = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  const { costTrendRecords } = getState().billing;
  const existedTrend = costTrendRecords[loginAccount];
  if (existedTrend) {
    return;
  }
  dispatch(setLoadingAllCostTrend(true));
  console.log('billing state', getState().billing);
  const dayjs = getUtcDayjs();
  const curTime = +new Date();
  const [end_year, end_month] = dayjs(curTime).add(1, 'month').format('YYYY-M').split('-');
  const [start_year, start_month] = dayjs(curTime)
    .subtract(10, 'month')
    .format('YYYY-M')
    .split('-');

  const params: GetMonthlyBillByOwnerParams = {
    owner: loginAccount,
    start_month,
    start_year,
    end_month,
    end_year,
  };

  const [data, error] = await getMonthlyBillByOwner(params);

  if (!data || error) {
    dispatch(setLoadingAllCostTrend(false));
    dispatch(
      setAllCostTrend({
        loginAccount,
        startTime: `${start_year}-${start_month}`,
        endTime: `${end_year}-${end_month}`,
        monthlyBills: [],
      }),
    );
    return error;
  }

  const curMonth = dayjs(curTime).format('YYYY-M');
  const curData = data.find((item) => {
    return `${item.bills[0].Year}-${item.bills[0].Month}` === curMonth;
  });
  dispatch(setLoadingAllCostTrend(false));
  dispatch(setCurMonthTotalCosted({ bills: curData?.bills }));
  dispatch(
    setAllCostTrend({
      loginAccount,
      startTime: `${start_year}-${start_month}`,
      endTime: `${end_year}-${end_month}`,
      monthlyBills: data,
    }),
  );
};

export const setupAccountCostTrend =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    const { accountCostTrendRecords } = getState().billing;
    const existedTrend = accountCostTrendRecords[address];
    if (existedTrend) {
      return;
    }

    const utcDayjs = getUtcDayjs();
    const curTime = +new Date();
    const [end_year, end_month] = utcDayjs(curTime).add(1, 'month').format('YYYY-M').split('-');
    const [start_year, start_month] = utcDayjs(curTime)
      .subtract(10, 'month')
      .format('YYYY-M')
      .split('-');
    const params: GetMonthlyBillByAddressParams = {
      address,
      start_month,
      start_year,
      end_month,
      end_year,
    };
    dispatch(setLoadingAccountCostTrend(true));
    const [data, error] = await getMonthlyBillByAddress(params);
    if (!data || error) {
      dispatch(setLoadingAccountCostTrend(false));
      return error;
    }
    dispatch(
      setAccountCostTrend({
        address,
        startTime: `${start_year}-${start_month}`,
        endTime: `${end_year}-${end_month}`,
        monthlyBills: data,
      }),
    );
    dispatch(setLoadingAccountCostTrend(false));
  };

export const setupAccountBills =
  (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
    dispatch(setLoadingAccountBills(true));
    const { accountBillPageSize } = getState().persist;
    const {
      accountBillsCountRecords,
      accountBillListPage,
      accountBillRangeFilter,
      accountBillTypeFilter,
    } = getState().billing;
    const existedCount = accountBillsCountRecords[address];
    const refreshCount = !existedCount || existedCount === 1;
    const getCountParams: GetRealTimeBillByAddressCountParams = {
      address,
    };
    if (!isEmpty(accountBillTypeFilter)) {
      getCountParams['types'] = accountBillTypeFilter;
    }
    if (typeof accountBillRangeFilter[0] !== 'string') {
      getCountParams['start'] = dayjs(accountBillRangeFilter[0]).unix();
      getCountParams['end'] = dayjs(accountBillRangeFilter[1]).unix();
    }
    const [count, cError] = refreshCount
      ? await getRealTimeBillCountByAddress(getCountParams)
      : [existedCount, null];
    const getListParams: GetRealTimeBillListByAddressParams = {
      ...getCountParams,
      page: accountBillListPage,
      per_page: accountBillPageSize,
    };
    const [bills, bError] = await getRealTimeBillByAddress(getListParams);
    if (count === null || cError || bills === null || bError) {
      dispatch(setLoadingAccountBills(false));
      return cError || bError;
    }
    dispatch(setLoadingAccountBills(false));
    dispatch(setAccountBillsCount({ address: getCountParams.address, count }));
    dispatch(setAccountBills({ address: getCountParams.address, bills: bills }));
  };

export const setupAllBills = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { billsCountRecords, billListPage, billRangeFilter, billAccountFilter, billTypeFilter } =
    getState().billing;
  const { ownerAccount, paymentAccountListRecords } = getState().accounts;
  const keyAccounts = keyBy(
    [ownerAccount, ...(paymentAccountListRecords[ownerAccount.address] || [])],
    'id',
  );
  const { billPageSize, loginAccount } = getState().persist;
  const existedCount = billsCountRecords[loginAccount];
  const refreshCount = !existedCount || billListPage === 1;

  dispatch(setLoadingAllBills(true));
  const allFilterAddress = billAccountFilter.map((item) => keyAccounts[item]?.address);
  const getCountParams: GetRealTimeBillByOwnerCountParams = {
    owner: loginAccount,
    payments: allFilterAddress,
  };
  if (!isEmpty(billTypeFilter)) {
    getCountParams['types'] = billTypeFilter;
  }

  if (typeof billRangeFilter[0] === 'string' && billRangeFilter[0] !== '') {
    getCountParams['start'] = dayjs(billRangeFilter[0]).startOf('d').unix();
    getCountParams['end'] = dayjs(billRangeFilter[1]).endOf('d').unix();
  }

  const [count, cError] = refreshCount
    ? await getRealTimeBillCountByOwner(getCountParams)
    : [existedCount, null];
  const getListParams: GetRealTimeBillListByOwnerParams = {
    ...getCountParams,
    page: billListPage,
    per_page: billPageSize,
  };
  const [bills, bError] = await getRealTimeBillListByOwner(getListParams);
  if (count === null || cError || bills === null || bError) {
    dispatch(setLoadingAllBills(false));
    return toast.error({ description: cError || bError || 'Failed to get billing list.' });
  }
  dispatch(setAllBillsCount({ loginAccount: getCountParams.owner, count }));
  dispatch(setAllBills({ loginAccount: getCountParams.owner, bills }));
  dispatch(setLoadingAllBills(false));
};

export default billingSlice.reducer;
