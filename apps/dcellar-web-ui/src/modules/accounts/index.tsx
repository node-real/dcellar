import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@totejs/uikit';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { NonRefundableModal } from './components/NonRefundableModal';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch } from '@/store';
import { useMount, useWhyDidYouUpdate } from 'ahooks';
import { AccountOperations } from '@/modules/accounts/components/AccountOperations';
import Head from 'next/head';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';
import { CurForecastCost } from './components/CurForecastCost';
import { CurMonthCost } from './components/CurMonthCost';
import {
  setupTotalCost,
  setupAllCostTrend,
  setupAllBills,
  setCurrentAllBillsPage,
  setAllFilterAccounts,
  setAllFilterRange,
  setAllFilterTypes,
} from '@/store/slices/billing';
import { TotalCost } from './components/TotalCost';
import { TotalCostTrend } from './components/TotalCostTrend';
import { NewPA } from './components/NewPA';
import { SectionHeader } from './components/Common';
import { AllBillingHistory } from './components/AllBillingHistory';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { stringify } from 'querystring';

export type BillingHistoryQuery = {
  tab: 'a' | 'b';
  page: number;
  from?: string;
  to?: string;
  address?: string[];
  type?: string[];
}
const formatTabKey = (t: string | string[] | undefined) => {
  return typeof t === 'string' && ['a', 'b'].includes(t) ? t : 'a';
};
export const Accounts = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const query = router.query;
  const { tab, page, from, to, address, type } = query;

  const activeKey = formatTabKey(tab);
  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    dispatch(setupPaymentAccounts());
  });

  useWhyDidYouUpdate('11111', [tab, page, from, to, address, type])
  useEffect(() => {
    if (tab === 'a') return;
    const filterAccounts = typeof address === 'string' ? [address] : ((address || []) as string[]);
    const filterRange: [string, string] =
      typeof from === 'string' && typeof to === 'string' ? [from, to] : ['', ''];
    const filterTypes = typeof type === 'string' ? [type] : ((type || []) as string[]);
    const curPage = isNaN(+(page as string)) ? 1 : +(page as string);

    dispatch(setAllFilterRange(filterRange));
    dispatch(setAllFilterAccounts(filterAccounts));
    dispatch(setAllFilterTypes(filterTypes));
    dispatch(setCurrentAllBillsPage(curPage));
    dispatch(setupAllBills());
  }, [page, from, to, dispatch, address, type, tab]);

  const onChangeKey = (tabKey: string) => {
    query.tab = tabKey;
    // router.push(`/accounts?${stringify(query)}`, undefined, { shallow: false, scroll: false });
    router.push(`/accounts?${stringify({tab: tabKey})}`, undefined, { shallow: false, scroll: false });
  };

  return (
    <>
      <Head>
        <title>Accounts - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
      <NonRefundableModal />
      <AccountOperations />
      <>
        <Flex flexDirection={'column'} gap={16}>
          <Text as="h2" fontWeight={700} fontSize={24}>
            Accounts
          </Text>
          <Text fontSize={16} fontWeight={600}>
            Data Overview
          </Text>
          <Flex gap={16} wrap={'wrap'}>
            <Flex flexDirection={'column'} gap={16}>
              <CurMonthCost />
              <CurForecastCost />
            </Flex>
            <TotalCost />
            <TotalCostTrend />
          </Flex>
        </Flex>
        <Box mt={24} id='tab_container'>
          <Tabs isLazy={true} activeKey={activeKey}>
            <TabList>
              <Tab
                h={27}
                fontSize={16}
                fontWeight={500}
                pb={8}
                tabKey={'a'}
                onClick={() => onChangeKey('a')}
              >
                Account List
              </Tab>
              <Tab
                h={27}
                fontSize={16}
                fontWeight={500}
                pb={8}
                tabKey={'b'}
                onClick={() => onChangeKey('b')}
              >
                Billing History
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel panelKey={'a'}>
                <Flex flexDirection={'column'} gap={16}>
                  <Flex justifyContent={'space-between'} alignItems={'center'} marginTop={16}>
                    <SectionHeader>Account List</SectionHeader>
                    <NewPA />
                  </Flex>
                  <OwnerAccount />
                  <PaymentAccounts />
                </Flex>
              </TabPanel>
              <TabPanel panelKey={'b'}>
                <Flex flexDirection={'column'} gap={16}>
                  {/* <ComingBillingHistory /> */}
                  <AllBillingHistory />
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </>
    </>
  );
};
