import { useAsyncEffect, useMount, useThrottleEffect } from 'ahooks';
import { setupBnbPrice } from '@/store/slices/global';
import BigNumber from 'bignumber.js';
import { useBalance } from 'wagmi';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useAppDispatch, useAppSelector } from '@/store';
import { filterSps } from '@/store/slices/sp';
import { useRouter } from 'next/router';
import {
  selectBalance,
  setBalance,
  setupBalance,
  updateStaticBalance,
} from '@/store/slices/balance';

const MINIMUM_ALLOWED_CHANGED_BALANCE = '0.000005';

export function StreamBalance() {
  const dispatch = useAppDispatch();
  const { asPath } = useRouter();
  const { loginAccount: address, faultySps } = useAppSelector((root) => root.persist);
  const { availableBalance, useMetamaskValue, latestStaticBalance, lockFee, netflowRate } =
    useAppSelector(selectBalance(address));

  const { data: greenfieldBalanceData, refetch } = useBalance({
    address: address as any,
    chainId: GREENFIELD_CHAIN_ID,
    watch: useMetamaskValue,
    cacheTime: 5000,
  });

  const metamaskValue = greenfieldBalanceData?.formatted ?? '0';

  useMount(() => {
    dispatch(filterSps(faultySps));
    dispatch(setupBnbPrice());
  });

  useAsyncEffect(async () => {
    if (!address) return;
    // update metamask
    refetch();
  }, [asPath, refetch]);

  useThrottleEffect(() => {
    if (!address) return;
    dispatch(setupBalance(address, metamaskValue));
  }, [address]);

  useThrottleEffect(() => {
    if (useMetamaskValue) {
      dispatch(setBalance({ address, balance: { availableBalance: metamaskValue } }));
      return;
    }
    const _metamaskValue = BigNumber(metamaskValue);
    const _availableBalance = BigNumber(availableBalance);
    if (_metamaskValue.minus(_availableBalance).abs().gte(MINIMUM_ALLOWED_CHANGED_BALANCE))
      dispatch(setupBalance(address, metamaskValue));
  }, [metamaskValue]);

  useThrottleEffect(() => {
    const _availableBalance = BigNumber(availableBalance);
    const _netflowRate = BigNumber(netflowRate);
    const _latestStaticBalance = BigNumber(latestStaticBalance);
    const _lockFee = BigNumber(lockFee);

    if (_latestStaticBalance.gt(0)) {
      const newAvailableBalance = _netflowRate.plus(_availableBalance).toString();
      dispatch(setBalance({ address, balance: { availableBalance: newAvailableBalance } }));
      return;
    }

    const newLockFee = _lockFee.plus(_netflowRate).toString();
    dispatch(setBalance({ address, balance: { lockFee: newLockFee } }));
  }, [latestStaticBalance, netflowRate]);

  useThrottleEffect(() => {
    let ref: any = null;
    const _netflowRate = BigNumber(netflowRate);
    if (!_netflowRate.eq(0)) {
      ref = setInterval(() => {
        // todo refactor
        dispatch(updateStaticBalance({ address, offset: _netflowRate.multipliedBy(5).toString() }));
      }, 5000);
    } else {
      clearInterval(ref);
    }
    return () => clearInterval(ref);
  }, [netflowRate]);

  return <></>;
}
