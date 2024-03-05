import { useAppDispatch, useAppSelector } from '@/store';
import { setupAccountInfo, setupPaymentAccounts } from '@/store/slices/accounts';
import {
  setAccountFilterRange,
  setAccountFilterTypes,
  setCurrentAccountBillsPage,
  setupAccountBills,
  setupAccountCostTrend,
} from '@/store/slices/billing';
import { Flex } from '@node-real/uikit';
import { useMount } from 'ahooks';
import { isAddress } from 'ethers/lib/utils.js';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AccountBillingHistory } from './components/AccountBillingHistory';
import { AccountCostTrend } from './components/AccountCostTrend';
import AccountDetailNav from './components/AccountDetailNav';
import { AccountBreadCrumb } from './components/BreadCrumb';
import { MetaInfo } from './components/MetaInfo';
import { NonRefundableModal } from './components/NonRefundableModal';

const emptyObject = {};

export const AccountDetail = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountRecords = useAppSelector((root) => root.accounts.accountRecords);

  const { address, page, from, to, type } = router.query;
  const curAddress = address as string;
  const isOwnerAccount = address === loginAccount;
  const accountDetail = accountRecords?.[curAddress] || emptyObject;

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
    const curPage = isNaN(+(page as string)) ? 1 : +(page as string);

    dispatch(setAccountFilterRange(filterRange));
    dispatch(setAccountFilterTypes(filterTypes));
    dispatch(setCurrentAccountBillsPage(curPage));
    dispatch(setupAccountBills(curAddress));
  }, [page, from, to, dispatch, router.query, type, curAddress]);

  return (
    <>
      <Head>
        <title>{accountDetail.name} - DCellar</title>
      </Head>
      <NonRefundableModal />
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
