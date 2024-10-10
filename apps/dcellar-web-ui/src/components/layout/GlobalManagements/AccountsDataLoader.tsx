import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useBalance } from '@/hooks/useBalance';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBankOrWalletBalance,
  setupAccountRecords,
  setupOwnerAccount,
  setupPaymentAccounts,
} from '@/store/slices/accounts';
import { setupBnbUsdtExchangeRate } from '@/store/slices/global';
import { useAsyncEffect, useThrottleEffect } from 'ahooks';
import { useRouter } from 'next/router';

export const AccountsDataLoader = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);

  const { asPath } = useRouter();
  const { data: gnfdBalance } = useBalance({
    address: loginAccount as any,
    chainId: GREENFIELD_CHAIN_ID,
  });
  const metamaskValue = gnfdBalance?.formatted ?? '0';

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBnbUsdtExchangeRate());
    dispatch(setupOwnerAccount());
    dispatch(setupPaymentAccounts());
  }, [dispatch, loginAccount]);

  useThrottleEffect(() => {
    dispatch(setBankOrWalletBalance(metamaskValue));
  }, [metamaskValue]);

  useThrottleEffect(() => {
    const paymentAddress = bucketRecords[currentBucketName]?.PaymentAddress;
    paymentAddress && dispatch(setupAccountRecords(paymentAddress));
  }, [asPath]);

  return <></>;
};
