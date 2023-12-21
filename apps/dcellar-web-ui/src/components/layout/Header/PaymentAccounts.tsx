import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useBalance } from '@/hooks/useBalance';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBankBalance,
  setupAccountInfo,
  setupOwnerAccount,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { setupBnbPrice } from '@/store/slices/global';
import { useAsyncEffect, useThrottleEffect } from 'ahooks';
import { useRouter } from 'next/router';

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
    // TODO opt init payment accounts
    dispatch(setupPaymentAccounts());
  }, [dispatch, loginAccount]);

  const { data: gnfdBalance, refetch } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
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
