import { runtimeEnv } from '@/base/env';
import { AccountOperations } from '@/modules/accounts/components/AccountOperations';
import { useAppDispatch } from '@/store';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import {
  setAllFilterAccounts,
  setAllFilterRange,
  setAllFilterTypes,
  setCurrentAllBillsPage,
  setupAllBills,
  setupAllCostTrend,
  setupTotalCost,
} from '@/store/slices/billing';
import { networkTag } from '@/utils/common';
import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@node-real/uikit';
import { useMount } from 'ahooks';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { useEffect } from 'react';
import { AllBillingHistory } from './components/AllBillingHistory';
import { SectionHeader } from './components/Common';
import { CurForecastCost } from './components/CurForecastCost';
import { CurMonthCost } from './components/CurMonthCost';
import { CreatePaymentAccount } from './components/CreatePaymentAccount';
import { NonRefundableModal } from './components/NonRefundableModal';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccountList } from './components/PaymentAccountList';
import { TotalCost } from './components/TotalCost';
import { TotalCostTrend } from './components/TotalCostTrend';

export type BillingHistoryQuery = {
  tab: 'a' | 'b';
  page: number;
  from?: string;
  to?: string;
  address?: string[];
  type?: string[];
};

const formatTabKey = (t: string | string[] | undefined) => {
  return typeof t === 'string' && ['a', 'b'].includes(t) ? t : 'a';
};

export const Accounts = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const query = router.query;
  const { tab, page, from, to, address, type } = query;
  const activeKey = formatTabKey(tab);

  const onChangeKey = (tabKey: string) => {
    query.tab = tabKey;
    // router.push(`/accounts?${stringify(query)}`, undefined, { shallow: false, scroll: false });
    router.push(`/accounts?${stringify({ tab: tabKey })}`, undefined, {
      shallow: false,
      scroll: false,
    });
  };

  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    dispatch(setupPaymentAccounts());
  });

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
        <Box mt={24} id="tab_container">
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
                    <CreatePaymentAccount />
                  </Flex>
                  <OwnerAccount />
                  <PaymentAccountList />
                </Flex>
              </TabPanel>
              <TabPanel panelKey={'b'}>
                <Flex flexDirection={'column'} gap={16}>
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
