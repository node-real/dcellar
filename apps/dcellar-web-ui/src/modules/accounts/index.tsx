import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text, toast } from '@totejs/uikit';
import { OwnerAccount } from './components/OwnerAccount';
import { PaymentAccounts } from './components/PaymentAccounts';
import { NonRefundableModal } from './components/NonRefundableModal';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import { useAppDispatch } from '@/store';
import { useMount } from 'ahooks';
import { AccountOperations } from '@/modules/accounts/components/AccountOperations';
import Head from 'next/head';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';
import { CurForecastCost } from './components/CurForecastCost';
import { CurMonthCost } from './components/CurMonthCost';
import { setupTotalCost, setupAllCostTrend } from '@/store/slices/billing';
import { ComingBillingHistory } from './components/ComingBillingHistory';
import { TotalCost } from './components/TotalCost';
import { TotalCostTrend } from './components/TotalCostTrend';
import { NewPA } from './components/NewPA';
import { SectionHeader } from './components/Common';

export const Accounts = () => {
  const dispatch = useAppDispatch();

  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    dispatch(setupPaymentAccounts());
  });

  return (
    <>
      <Head>
        <title>Groups - DCellar{networkTag(runtimeEnv)}</title>
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
        <Box mt={16}>
          <Tabs isLazy={true}>
            <TabList>
              <Tab h={27} fontSize={16} fontWeight={500} pb={8}>
                Account List
              </Tab>
              <Tab h={27} fontSize={16} fontWeight={500} pb={8}>
                Billing History
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Flex flexDirection={'column'} gap={16}>
                  <Flex justifyContent={'space-between'} alignItems={'center'} marginTop={16}>
                    <SectionHeader>Account List</SectionHeader>
                    <NewPA />
                  </Flex>
                  <OwnerAccount />
                  <PaymentAccounts />
                </Flex>
              </TabPanel>
              <TabPanel>
                {/* <AllBillingHistory /> */}
                <Flex flexDirection={'column'} gap={16}>
                  <Flex
                    h={40}
                    marginTop={16}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                  >
                    <SectionHeader>Billing History</SectionHeader>
                  </Flex>
                  <ComingBillingHistory />
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </>
    </>
  );
};
