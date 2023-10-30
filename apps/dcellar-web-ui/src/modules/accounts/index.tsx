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

export const Accounts = () => {
  const dispatch = useAppDispatch();

  console.log('invoke accounts');
  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    const error = await dispatch(setupPaymentAccounts());
    if (error) {
      toast.error({
        description: error,
      });
    }
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
          <Flex gap={16}>
            <Flex flexDirection={'column'} gap={16}>
              <CurMonthCost />
              <CurForecastCost />
            </Flex>
            <TotalCost />
            <TotalCostTrend />
          </Flex>
        </Flex>
        <Box>
          <Tabs isLazy={true}>
            <TabList>
              <Tab>Account List</Tab>
              <Tab>Billing History</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <OwnerAccount />
                <PaymentAccounts />
              </TabPanel>
              <TabPanel>
                {/* <AllBillingHistory /> */}
                <ComingBillingHistory />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </>
    </>
  );
};
