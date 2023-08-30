import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBankBalance,
  setupAccountsInfo,
  setupOAList,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { setupGasObjects } from '@/store/slices/global';
import { useAsyncEffect, useThrottleEffect } from 'ahooks';
import { useRouter } from 'next/router';
import { useBalance } from 'wagmi';

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const { asPath } = useRouter();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { bucketInfo } = useAppSelector((state) => state.bucket);
  const { bucketName } = useAppSelector((state) => state.object);
  useAsyncEffect(async () => {
    dispatch(setupOAList());
    dispatch(setupPaymentAccounts());
    loginAccount && dispatch(setupAccountsInfo(loginAccount));
  }, [dispatch, setupGasObjects]);
  const { data: gnfdBalance, refetch } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
    watch: true,
    cacheTime: 5000,
  });
  const metamaskValue = gnfdBalance?.formatted ?? '0';
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    // update metamask
    refetch();
    dispatch(setBankBalance(metamaskValue));
  }, [asPath, refetch]);

  useThrottleEffect(() => {
    const paymentAddress = bucketInfo[bucketName]?.PaymentAddress;
    paymentAddress && dispatch(setupAccountsInfo(paymentAddress));
  }, [asPath]);

  return <></>;
};
