import Head from 'next/head';
import { AccountBreadCrumb } from './components/BreadCrumb';
import { Flex } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupAccountInfo, setupPaymentAccounts } from '@/store/slices/accounts';
import { useMount } from 'ahooks';
import { isAddress } from 'ethers/lib/utils.js';
import { MetaInfo } from './components/MetaInfo';
import { AccountCostTrend } from './components/AccountCostTrend';
import {
  setAccountFilterRange,
  setAccountFilterTypes,
  setCurrentAccountBillsPage,
  setupAccountBills,
  setupAccountCostTrend,
} from '@/store/slices/billing';
import AccountDetailNav from './components/AccountDetailNav';
import { AccountBillingHistory } from './components/AccountBillingHistory';
import { useEffect } from 'react';

const emptyObject = {};
export const AccountDetail = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { address, p, from, to, type } = router.query;
  const curAddress = address as string;
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOwnerAccount = address === loginAccount;
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const accountDetail = accountInfo?.[curAddress] || emptyObject;

  useMount(async () => {
    if (!curAddress) return;
    if (!isAddress(curAddress)) {
      router.replace('/no-account?err=noAccount');
      return;
    }
    isOwnerAccount ? dispatch(setupAccountInfo(curAddress)) : dispatch(setupPaymentAccounts());
    dispatch(setupAccountCostTrend(curAddress));
  });
  useEffect(() => {
    const filterRange: [string, string] =
      typeof from === 'string' && typeof to === 'string' ? [from, to] : ['', ''];
    const filterTypes = typeof type === 'string' ? [type] : ((type || []) as string[]);
    const page = isNaN(+(p as string)) ? 1 : +(p as string);

    dispatch(setAccountFilterRange(filterRange));
    dispatch(setAccountFilterTypes(filterTypes));
    dispatch(setCurrentAccountBillsPage(page));
    dispatch(setupAccountBills(curAddress));
  }, [p, from, to, dispatch, router.query, type, curAddress]);

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
        {/* <ComingBillingHistory /> */}
        <AccountBillingHistory address={curAddress} />
      </Flex>
    </>
  );
};
