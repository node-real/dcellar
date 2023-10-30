import { GetMonthlyBillByAddressParams, GetMonthlyBillByAddressResponse, GetMonthlyBillByOwnerParams, GetMonthlyBillByOwnerResponse, GetRealTimeBillByAddressParams, GetRealTimeBillByAddressResponse, GetRealTimeBillListByOwnerParams, RawMonthlyBill, getMonthlyBillByAddress, getMonthlyBillByOwner, getRealTimeBillByAddress, getRealTimeBillCountByAddress, getRealTimeBillCountByOwner, getRealTimeBillListByOwner, getTotalCostByOwner } from '@/facade/billing';
import { BN } from '@/utils/math';
import { getPosDecimalValue } from '@/utils/wallet';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { AppDispatch, AppState, GetState } from '..';
import { getUtcDayjs } from '@/utils/time';

type AccountCost = {
  address: string;
  cost: string;
}
export type AllCost = {
  totalCost: string;
  detailCosts: AccountCost[];
}
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
  detailBills: DetailBill[]
}
export type AllCostTrend = {
  startTime: string;
  endTime: string;
  readCost: string;
  storeCost: string;
  totalCost: string;
  monthlyCost: {
    [key: string]: MonthlyCost
  };
}
export type AccountCostBill = {
  address: string;
  time: string;
  totalCost: string;
  readCost: string;
  storeCost: string;
}
export type AccountCostTrend = {
  startTime: string;
  endTime: string;
  monthlyCost: {
    [key: string]: AccountCostBill
  }
}
export type AccountBill = {
  address: string;
  timestamp: number;
  readCost: string;
  storeCost: string;
  totalCost: string;
  balance: string;
}
interface BillingState {
  curAllBillsPage: number;
  curAccountBillsPage: number;
  loadingAllCost: boolean;
  loadingAllCostTrend: boolean;
  loadingAccountCostTrend: boolean;
  loadingAccountBills: boolean;
  loadingAllBills: boolean;
  allCost: Record<string, AllCost>;
  allCostTrend: Record<string, AllCostTrend>;
  accountCostTrend: Record<string, AccountCostTrend>;
  curMonthTotalCosted: string;
  accountBillsCount: Record<string, number>;
  accountBills: Record<string, AccountBill[]>;
  allBillsCount: Record<string, number>;
  allBills: Record<string, AccountBill[]>;
}
const initialState: BillingState = {
  curAllBillsPage: 1,
  curAccountBillsPage: 1,
  loadingAllCost: false,
  loadingAllCostTrend: false,
  loadingAccountCostTrend: false,
  loadingAccountBills: false,
  loadingAllBills: false,
  allCost: {},
  allCostTrend: {},
  accountCostTrend: {},
  curMonthTotalCosted: '',
  accountBillsCount: {},
  accountBills: {},
  allBillsCount: {},
  allBills: {},

};

export const billingSlice = createSlice({
  name: 'billing',
  initialState: initialState,
  reducers: {
    setTotalCost: (state, { payload }: PayloadAction<{ loginAccount: string, accountCosts: AccountCost[] }>) => {
      const { loginAccount, accountCosts } = payload;
      const detailCosts = accountCosts.map((item) => ({
        ...item,
        cost: BN(getPosDecimalValue(item.cost)).abs().toString()
      }));
      const totalCost = getPosDecimalValue(accountCosts.reduce((pre, cur) => {
        return BN(pre).plus(cur.cost)
      }, BN(0)).abs());

      state['allCost'][loginAccount] = {
        totalCost,
        detailCosts,
      };
    },
    setCurMonthTotalCosted: (state, { payload }: PayloadAction<{ bills: RawMonthlyBill[] | undefined }>) => {
      const { bills } = payload;
      if (!bills) {
        state.curMonthTotalCosted = '0';
        return;
      }
      const curMonthTotalCosted = getPosDecimalValue(bills.reduce((pre, cur) => {
        return BN(pre).plus(cur.TotalCost)
      }, BN(0)).abs());
      state.curMonthTotalCosted = curMonthTotalCosted;
    },
    setAllCostTrend: (state, { payload }: PayloadAction<{ loginAccount: string, startTime: string, endTime: string, monthlyBills: GetMonthlyBillByOwnerResponse }>) => {
      const dayjs = getUtcDayjs();
      const { startTime, endTime, loginAccount, monthlyBills } = payload;
      let allCostTrend = {
        monthlyCost: {}
      } as AllCostTrend;
      let allTotalCost = BN(0);
      let allTotalReadCost = BN(0);
      let allTotalStoreCost = BN(0);
      monthlyBills.forEach((item) => {
        const key = item.bills[0].Year + '.' + item.bills[0].Month;
        if (allCostTrend['monthlyCost'][key]) {
          allCostTrend['monthlyCost'][key] = {} as MonthlyCost;
        }
        let monthlyTotalCost = BN(0);
        let monthlyTotalReadCost = BN(0);
        let monthlyTotalStoreCost = BN(0);
        const detailBills = item.bills.map(bill => {
          monthlyTotalCost = monthlyTotalCost.plus(bill.TotalCost)
          monthlyTotalReadCost = monthlyTotalReadCost.plus(bill.ReadCost);
          monthlyTotalStoreCost = monthlyTotalStoreCost.plus(bill.StoreCost);
          return {
            address: bill.Address,
            time: bill.Year + '.' + bill.Month,
            readCost: getPosDecimalValue(bill.ReadCost),
            storeCost: getPosDecimalValue(bill.StoreCost),
            totalCost: getPosDecimalValue(bill.TotalCost)
          }
        }).sort((a, b) => BN(b.totalCost).comparedTo(a.totalCost));
        allTotalCost = allTotalCost.plus(monthlyTotalCost)
        allTotalReadCost = allTotalReadCost.plus(monthlyTotalReadCost);
        allTotalStoreCost = allTotalStoreCost.plus(monthlyTotalStoreCost);
        const monthlyCost: MonthlyCost = {
          time: key,
          month: dayjs(key).format('MMM'),
          totalCost: getPosDecimalValue(allTotalCost),
          readCost: getPosDecimalValue(allTotalReadCost),
          storeCost: getPosDecimalValue(allTotalStoreCost),
          detailBills: detailBills || [],
        }
        allCostTrend['monthlyCost'][key] = monthlyCost
      });
      allCostTrend = {
        ...allCostTrend,
        totalCost: getPosDecimalValue(allTotalCost),
        readCost: getPosDecimalValue(allTotalReadCost),
        storeCost: getPosDecimalValue(allTotalStoreCost),
        startTime,
        endTime
      }
      state['allCostTrend'][loginAccount] = allCostTrend;
    },
    setAccountCostTrend: (state, { payload }: PayloadAction<{ address: string, startTime: string, endTime: string, monthlyBills: GetMonthlyBillByAddressResponse }>) => {
      const { startTime, endTime, address, monthlyBills } = payload;
      const data = {} as {
        [key: string]: AccountCostBill
      }
      monthlyBills.forEach((item) => {
        const key = item.Year + '.' + item.Month;
        data[key] = {
          time: key,
          address: item.Address,
          totalCost: getPosDecimalValue(item.TotalCost),
          readCost: getPosDecimalValue(item.ReadCost),
          storeCost: getPosDecimalValue(item.StoreCost)
        }
      })
      state['accountCostTrend'][address] = {
        startTime,
        endTime,
        monthlyCost: data,
      }
    },

    setLoadingAllCost: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingAllCost = payload
    },
    setLoadingAllCostTrend: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingAllCostTrend = payload
    },
    setLoadingAccountCostTrend: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingAccountCostTrend = payload
    },
    setAccountBillsCount: (state, { payload }: PayloadAction<{ address: string, count: number }>) => {
      const { address, count } = payload;
      state.accountBillsCount[address] = count;
    },
    setAccountBills: (state, { payload }: PayloadAction<{ address: string, bills: GetRealTimeBillByAddressResponse }>) => {
      const dayjs = getUtcDayjs();
      const { address, bills } = payload;
      const formatBills = (bills || []).map((item) => ({
        address: item.Address,
        timestamp: dayjs(item.Timestamp).valueOf(),
        readCost: getPosDecimalValue(item.ReadCost),
        storeCost: getPosDecimalValue(item.StoreCost),
        totalCost: getPosDecimalValue(item.TotalCost),
        balance: getPosDecimalValue(item.Balance)
      }));

      state['accountBills'][address] = formatBills;
    },
    setAllBillsCount: (state, { payload }: PayloadAction<{ loginAccount: string, count: number }>) => {
      const { loginAccount, count } = payload;
      state.allBillsCount[loginAccount] = count;
    },
    setAllBills: (state, { payload }: PayloadAction<{ loginAccount: string, bills: GetRealTimeBillByAddressResponse }>) => {
      const dayjs = getUtcDayjs();
      const { loginAccount, bills } = payload;
      const formatBills = (bills || []).map((item) => ({
        address: item.Address,
        timestamp: dayjs(item.Timestamp).valueOf(),
        readCost: getPosDecimalValue(item.ReadCost),
        storeCost: getPosDecimalValue(item.StoreCost),
        totalCost: getPosDecimalValue(item.TotalCost),
        balance: getPosDecimalValue(item.Balance)
      }));
      state['allBills'][loginAccount] = formatBills;
    },
    setCurrentAllBillsPage(state, { payload }: PayloadAction<number>) {
      state.curAllBillsPage = payload;
    },
    setCurrentAccountBillsPage(state, { payload }: PayloadAction<number>) {
      state.curAccountBillsPage = payload;
    },
    setLoadingAccountBills: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingAccountBills = payload
    },
    setLoadingAllBills: (state, { payload }: PayloadAction<boolean>) => {
      state.loadingAllBills = payload
    },
  },
});

export const { setTotalCost, setCurMonthTotalCosted, setAllCostTrend, setAccountCostTrend, setLoadingAllCostTrend, setLoadingAccountCostTrend, setAccountBillsCount, setAccountBills, setCurrentAllBillsPage, setCurrentAccountBillsPage, setLoadingAccountBills, setAllBills, setAllBillsCount, setLoadingAllBills, setLoadingAllCost } = billingSlice.actions;

export const selectAllCost = (address: string) => (root: AppState) => {
  return root.billing.allCost[address] || {};
}
export const selectAllCostTrend = (address: string) => (root: AppState) => {
  return root.billing.allCostTrend[address] || {};
}
export const selectAccountCostTrend = (address: string) => (root: AppState) => {
  if (!address) return {} as AccountCostTrend
  return root.billing.accountCostTrend[address];
}
export const selectAccountBills = (address: string) => (root: AppState) => {
  return root.billing.accountBills[address] || []
}
export const selectAccountBillsCount = (address: string) => (root: AppState) => {
  return root.billing.accountBillsCount[address] || 0;
}
export const selectAllBills = (address: string) => (root: AppState) => {
  return root.billing.allBills[address] || []
}
export const selectAllBillsCount = (address: string) => (root: AppState) => {
  return root.billing.allBillsCount[address] || 0;
}
export const setupTotalCost = () => async (dispatch: AppDispatch, getState: GetState) => {
  const { loginAccount } = getState().persist;
  dispatch(setLoadingAllCost(true));
  const [data, error] = await getTotalCostByOwner(loginAccount);
  if (!data || error) {
    dispatch(setLoadingAllCost(false));
    return error
  };
  const accountCosts = data.map(item => ({
    address: item.Address,
    cost: item.Cost
  }));
  dispatch(setLoadingAllCost(false))
  dispatch(setTotalCost({ loginAccount, accountCosts }));
}

export const setupAllCostTrend = () => async (dispatch: AppDispatch, getState: GetState) => {
  dispatch(setLoadingAllCostTrend(true));
  const { loginAccount } = getState().persist;
  const dayjs = getUtcDayjs();
  const curTime = +new Date();
  const [end_year, end_month] = dayjs(curTime).add(1, 'month').format('YYYY.MM').split('.')
  const [start_year, start_month] = dayjs(curTime).subtract(10, 'month').format('YYYY.MM').split('.');

  const params: GetMonthlyBillByOwnerParams = {
    owner: loginAccount,
    start_month,
    start_year,
    end_month,
    end_year,
  }
  const [data, error] = await getMonthlyBillByOwner(params);
  if (!data || error) {
    dispatch(setLoadingAllCostTrend(false));
    return error
  };

  const curMonth = dayjs(curTime).format('YYYY.M');
  const curData = data.find(item => {
    return `${item.bills[0].Year}.${item.bills[0].Month}` === curMonth;
  });
  dispatch(setLoadingAllCostTrend(false));
  dispatch(setCurMonthTotalCosted({ bills: curData?.bills }));
  dispatch(setAllCostTrend({ loginAccount, startTime: `${start_year}.${start_month}`, endTime: `${end_year}.${end_month}`, monthlyBills: data }))
}

export const setupAccountCostTrend = (address: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const utcDayjs = getUtcDayjs();
  const curTime = +new Date();
  const [end_year, end_month] = utcDayjs(curTime).add(1, 'month').format('YYYY.MM').split('.')
  const [start_year, start_month] = utcDayjs(curTime).subtract(10, 'month').format('YYYY.MM').split('.');
  const params: GetMonthlyBillByAddressParams = {
    address,
    start_month,
    start_year,
    end_month,
    end_year,
  }
  dispatch(setLoadingAccountCostTrend(true))
  console.time('setLoadingAccountCostTrend')
  const [data, error] = await getMonthlyBillByAddress(params);
  console.timeEnd('setLoadingAccountCostTrend');
  if (!data || error) {
    dispatch(setLoadingAccountCostTrend(false))
    return error;
  };
  dispatch(setAccountCostTrend({ address, startTime: `${start_year}.${start_month}`, endTime: `${end_year}.${end_month}`, monthlyBills: data }))
  dispatch(setLoadingAccountCostTrend(false));
}

export const setupAccountBills = (params: GetRealTimeBillByAddressParams) => async (dispatch: AppDispatch, getState: GetState) => {
  dispatch(setLoadingAccountBills(true));
  const getCountParams = {
    address: params.address,
    start: params.start,
    end: params.end
  }
  const [count, cError] = await getRealTimeBillCountByAddress(getCountParams);
  const [bills, bError] = await getRealTimeBillByAddress(params);
  if (!count || cError || !bills || bError) {
    dispatch(setLoadingAccountBills(false));
    return cError || bError;
  }
  dispatch(setLoadingAccountBills(false));
  dispatch(setAccountBillsCount({ address: params.address, count }));
  dispatch(setAccountBills({ address: params.address, bills: bills }));
}

export const setupAllBills = (params: GetRealTimeBillListByOwnerParams) => async (dispatch: AppDispatch, getState: GetState) => {
  dispatch(setLoadingAllBills(true));
  const getCountParams = {
    owner: params.owner,
    payments: params.payments,
    start: params.start,
    end: params.end
  }
  const [count, cError] = await getRealTimeBillCountByOwner(getCountParams);
  const [bills, bError] = await getRealTimeBillListByOwner(params);
  if (!count || cError || !bills || bError) {
    dispatch(setLoadingAllBills(false));
    return cError || bError;
  }
  dispatch(setLoadingAllBills(false));
  dispatch(setAllBillsCount({ loginAccount: params.owner, count }));
  dispatch(setAllBills({ loginAccount: params.owner, bills: bills }));
}

export default billingSlice.reducer;
