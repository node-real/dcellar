import Head from 'next/head';
import { AccountBreadCrumb } from './components/BreadCrumb';
import { Flex } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupAccountInfo, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAsyncEffect } from 'ahooks';
import { isAddress } from 'ethers/lib/utils.js';
import { MetaInfo } from './components/MetaInfo';
import { AccountCostTrend } from './components/AccountCostTrend';
import { setupAccountCostTrend } from '@/store/slices/billing';
import { ComingBillingHistory } from './components/ComingBillingHistory';
import AccountDetailNav from './components/AccountDetailNav';

const emptyObject = {};
export const AccountDetail = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { address } = router.query;
  const curAddress = address as string;
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOwnerAccount = address === loginAccount;
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const accountDetail = accountInfo?.[curAddress] || emptyObject;

  useAsyncEffect(async () => {
    if (!curAddress) return;
    if (!isAddress(curAddress)) {
      router.replace('/no-account?err=noAccount');
      return;
    }
    isOwnerAccount
      ? dispatch(setupAccountInfo(curAddress))
      : dispatch(setupPaymentAccounts());
    dispatch(setupAccountCostTrend(curAddress));
  }, [address]);

  return (
    <>
    <Head>
        <title>{accountDetail.name} - DCellar</title>
      </Head>
      <Flex gap={16} flexDirection={'column'}>
        <AccountBreadCrumb name={accountDetail.name} />
        <AccountDetailNav address={curAddress} />
        <Flex gap={16} flexWrap={'wrap'}>
          <MetaInfo address={curAddress} />
          <AccountCostTrend address={curAddress} />
        </Flex>
        <Flex alignItems={'center'} fontSize={16} fontWeight={600} h={40}>
          Billing History
        </Flex>
        <ComingBillingHistory />
        {/* <AccountBillingHistory address={curAddress} /> */}
      </Flex>
    </>
  );
};
