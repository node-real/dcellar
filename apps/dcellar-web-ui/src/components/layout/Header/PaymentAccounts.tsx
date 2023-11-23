import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBankBalance,
  setupAccountInfo,
  setupOwnerAccount,
} from '@/store/slices/accounts';
import { setupBnbPrice } from '@/store/slices/global';
import { useAsyncEffect, useThrottleEffect } from 'ahooks';
import { useRouter } from 'next/router';
import { useBalance } from 'wagmi';

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const { asPath } = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { bucketName } = useAppSelector((root) => root.object);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBnbPrice());
    dispatch(setupOwnerAccount());
    // dispatch(setupPaymentAccounts());
  }, [dispatch, loginAccount]);

  const { data: gnfdBalance, refetch } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
    watch: true,
    cacheTime: 1000,
  });
  const metamaskValue = gnfdBalance?.formatted ?? '0';
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    // update metamask
    refetch();
    dispatch(setBankBalance(metamaskValue));
  }, [asPath, refetch, loginAccount]);

  useThrottleEffect(() => {
    dispatch(setBankBalance(metamaskValue));
  }, [metamaskValue]);

  useThrottleEffect(() => {
    const paymentAddress = bucketInfo[bucketName]?.PaymentAddress;
    paymentAddress && dispatch(setupAccountInfo(paymentAddress));
  }, [asPath]);

  return <></>;
};
