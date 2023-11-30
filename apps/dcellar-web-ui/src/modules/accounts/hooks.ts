import { useAppSelector } from '@/store';
import { selectStoreFeeParams } from '@/store/slices/global';
import { selectAccount, selectAccountDetail, selectPaymentAccounts } from '@/store/slices/accounts';
import { isEmpty } from 'lodash-es';
import { BN } from '@/utils/math';
import { getUtcDayjs } from '@/utils/time';
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
  const utcDayjs = getUtcDayjs();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { curMonthTotalCosted } = useAppSelector((root) => root.billing);
  const { totalPANetflowRate } = useAppSelector((root) => root.accounts);
  const othersNetflowRate = totalPANetflowRate[loginAccount] || 0;
  const ownerAccountDetail = useAppSelector(selectAccountDetail(loginAccount));
  const forecastCost = useMemo(() => {
    const ownerNetflowRate = ownerAccountDetail.netflowRate;
    const totalNetflowRate = BN(ownerNetflowRate || 0).plus(othersNetflowRate || 0).abs();
    const curTime = +new Date();
    let curCosted = '';
    let curRemainingEstimateCost = '';
    let nextEstimateCost = '';
    if (types.includes('cur')) {
      const remainingSeconds = utcDayjs(curTime).endOf('M').unix() - utcDayjs(curTime).startOf('D').unix();
      curCosted = BN(curMonthTotalCosted || 0).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
      curRemainingEstimateCost = BN(remainingSeconds).multipliedBy(totalNetflowRate).abs().dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
    }
    if (types.includes('next')) {
      const remainingSeconds = utcDayjs(curTime).add(1, 'month').endOf('M').unix() - utcDayjs(curTime).add(1, 'month').startOf('M').unix();
      const needCost = BN(remainingSeconds).multipliedBy(totalNetflowRate);

      nextEstimateCost = BN(needCost).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
    }
    return {
      curCosted,
      curRemainingEstimateCost,
      nextEstimateCost,
    }
  }, [curMonthTotalCosted, othersNetflowRate, ownerAccountDetail?.netflowRate, types, utcDayjs]);

  return forecastCost
}

export const useAccountEstimateCost = (address: string, types: EstimateCostType[]) => {
  const dayjs = getUtcDayjs();
  const { accountCostTrend } = useAppSelector((root) => root.billing);
  const { netflowRate } = useAppSelector(selectAccountDetail(address));
  const curTime = +new Date();
  const curMonthRemainingSeconds = dayjs(curTime).endOf('M').unix() - dayjs(curTime).startOf('M').unix();
  const nextMonthSeconds = dayjs(curTime).add(1, 'month').endOf('M').unix() - dayjs(curTime).add(1, 'month').startOf('M').unix();

  let curCosted = '';
  let curRemainingEstimateCost = '';
  let nextEstimateCost = '';
  const key = dayjs(curTime).format('YYYY-M');
  const curMonthCost = accountCostTrend[key] || {};
  if (types.includes('cur')) {
    curCosted = curMonthCost?.monthlyCost?.[key].totalCost;
    const estimateCost = BN(curMonthRemainingSeconds).multipliedBy(netflowRate).abs().dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
    curRemainingEstimateCost = BN(estimateCost).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();
  }
  if (types.includes('next')) {
    const estimateCost = BN(nextMonthSeconds).multipliedBy(netflowRate).abs().dp(8).toString();
    nextEstimateCost = estimateCost;
  }
  return {
    curCosted,
    curRemainingEstimateCost,
    nextEstimateCost,
  }
}
export const useAccountList = () => {
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const accountList = useMemo(
    () => [ownerAccount, ...(paymentAccounts || [])],
    [paymentAccounts, ownerAccount],
  );
  return accountList
}