import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useBalance } from '@/hooks/useBalance';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBankOrWalletBalance,
  setupAccountInfo,
  setupOwnerAccount,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { setupBnbPrice } from '@/store/slices/global';
import { useAsyncEffect, useThrottleEffect } from 'ahooks';
import { useRouter } from 'next/router';

export const PaymentAccounts = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);

  const { asPath } = useRouter();
  const { data: gnfdBalance, refetch } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
  });
  const metamaskValue = gnfdBalance?.formatted ?? '0';

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBnbPrice());
    dispatch(setupOwnerAccount());
    // TODO opt init payment accounts
    dispatch(setupPaymentAccounts());
  }, [dispatch, loginAccount]);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    // update metamask
    refetch();
    dispatch(setBankOrWalletBalance(metamaskValue));
  }, [asPath, refetch, loginAccount]);

  useThrottleEffect(() => {
    dispatch(setBankOrWalletBalance(metamaskValue));
  }, [metamaskValue]);

  useThrottleEffect(() => {
    const paymentAddress = bucketRecords[currentBucketName]?.PaymentAddress;
    paymentAddress && dispatch(setupAccountInfo(paymentAddress));
  }, [asPath]);

  return <></>;
};
