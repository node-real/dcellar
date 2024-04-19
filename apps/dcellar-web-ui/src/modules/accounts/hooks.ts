import { useAppSelector } from '@/store';
import { selectAccount, selectPaymentAccounts } from '@/store/slices/accounts';
import { selectStoreFeeParams } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { getUtcDayjs } from '@/utils/time';
import { isEmpty } from 'lodash-es';
import { useMemo } from 'react';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '../wallet/constants';

export const useUnFreezeAmount = (address: string) => {
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const account = useAppSelector(selectAccount(address));

  if (isEmpty(storeFeeParams) || isEmpty(account)) return '--';

  return BN(storeFeeParams.reserveTime)
    .times(BN(account.frozenNetflowRate || account.netflowRate))
    .toString();
};

type EstimateCostType = 'cur' | 'next';

export const useTotalEstimateCost = (types: EstimateCostType[]) => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const monthTotalCost = useAppSelector((root) => root.billing.monthTotalCost);
  const paymentAccountNetflowRateRecords = useAppSelector(
    (root) => root.accounts.paymentAccountNetflowRateRecords,
  );

  const ownerAccountDetail = useAppSelector(selectAccount(loginAccount));

  const utcDayjs = getUtcDayjs();
  const othersNetflowRate = paymentAccountNetflowRateRecords[loginAccount] || 0;
  const isLoading =
    monthTotalCost === '' ||
    isEmpty(paymentAccountNetflowRateRecords) ||
    isEmpty(ownerAccountDetail);

  return useMemo(() => {
    if (isLoading) {
      return {
        curCosted: '',
        curRemainingEstimateCost: '',
        nextEstimateCost: '',
      };
    }
    const ownerNetflowRate = ownerAccountDetail.netflowRate;
    const totalNetflowRate = BN(ownerNetflowRate || 0)
      .plus(othersNetflowRate || 0)
      .abs();
    const curTime = +new Date();
    let curCosted = '';
    let curRemainingEstimateCost = '';
    let nextEstimateCost = '';
    if (types.includes('cur')) {
      const remainingSeconds =
        utcDayjs(curTime).endOf('M').unix() - utcDayjs(curTime).startOf('D').unix();
      curCosted = BN(monthTotalCost || 0)
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString();
      curRemainingEstimateCost = BN(remainingSeconds)
        .multipliedBy(totalNetflowRate)
        .abs()
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString();
    }
    if (types.includes('next')) {
      const remainingSeconds =
        utcDayjs(curTime).add(1, 'month').endOf('M').unix() -
        utcDayjs(curTime).add(1, 'month').startOf('M').unix();
      const needCost = BN(remainingSeconds).multipliedBy(totalNetflowRate);

      nextEstimateCost = BN(needCost).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
    }
    return {
      curCosted,
      curRemainingEstimateCost,
      nextEstimateCost,
    };
  }, [
    isLoading,
    monthTotalCost,
    othersNetflowRate,
    ownerAccountDetail?.netflowRate,
    types,
    utcDayjs,
  ]);
};

export const useAccountEstimateCost = (address: string, types: EstimateCostType[]) => {
  const accountCostTrendRecords = useAppSelector((root) => root.billing.accountCostTrendRecords);

  const { netflowRate } = useAppSelector(selectAccount(address));

  const dayjs = getUtcDayjs();
  const curTime = +new Date();
  const curMonthRemainingSeconds =
    dayjs(curTime).endOf('M').unix() - dayjs(curTime).startOf('M').unix();
  const nextMonthSeconds =
    dayjs(curTime).add(1, 'month').endOf('M').unix() -
    dayjs(curTime).add(1, 'month').startOf('M').unix();
  let curCosted = '';
  let curRemainingEstimateCost = '';
  let nextEstimateCost = '';
  const key = dayjs(curTime).format('YYYY-M');
  const curMonthCost = accountCostTrendRecords[key] || {};

  if (types.includes('cur')) {
    curCosted = curMonthCost?.monthlyCost?.[key].totalCost;
    const estimateCost = BN(curMonthRemainingSeconds)
      .multipliedBy(netflowRate)
      .abs()
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
    curRemainingEstimateCost = BN(estimateCost).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
  }

  if (types.includes('next')) {
    nextEstimateCost = BN(nextMonthSeconds).multipliedBy(netflowRate).abs().dp(8).toString();
  }

  return {
    curCosted,
    curRemainingEstimateCost,
    nextEstimateCost,
  };
};

export const useAccountList = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);

  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));

  return useMemo(() => [ownerAccount, ...(paymentAccounts || [])], [paymentAccounts, ownerAccount]);
};
