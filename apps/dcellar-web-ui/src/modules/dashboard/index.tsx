import { Box, Flex, Text } from '@totejs/uikit';
import { ToolBox } from './components/ToolBox';
import { TotalBalance } from './components/TotalBalance';
import { Stats } from './components/Stats';
import { CurMonthCost } from '../accounts/components/CurMonthCost';
import { CurForecastCost } from '../accounts/components/CurForecastCost';
import { Charts } from './components/Charts';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import { setupAllCostTrend, setupTotalCost } from '@/store/slices/billing';
import { useMount } from 'ahooks';
import { setupBuckets } from '@/store/slices/bucket';

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    dispatch(setupPaymentAccounts());
    dispatch(setupBuckets(loginAccount));
  });
  return (
    <Box>
      <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
        Dashboard
      </Text>
      <Flex gap={16}>
        <Flex flexDirection={'column'} gap={16} flex={1} minW={0}>
          <Flex gap={16}>
            <CurMonthCost flex={1} />
            <CurForecastCost flex={1} />
          </Flex>
          <Charts  />
          <Stats />
        </Flex>
        <Flex flexDirection={'column'} gap={16}>
          <TotalBalance />
          <ToolBox />
        </Flex>
      </Flex>
    </Box>
  );
};
