import { Box, Flex, Text, useMediaQuery } from '@totejs/uikit';
import { ToolBox } from './components/ToolBox';
import { TotalBalance } from './components/TotalBalance';
import { Stats } from './components/Stats';
import { CurMonthCost } from '../accounts/components/CurMonthCost';
import { CurForecastCost } from '../accounts/components/CurForecastCost';
import { BucketStorageChart } from './components/BucketStorageChart';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupOwnerAccount, setupPaymentAccounts } from '@/store/slices/accounts';
import { setupAllCostTrend, setupTotalCost } from '@/store/slices/billing';
import { useMount } from 'ahooks';
import { setupBuckets } from '@/store/slices/bucket';
import { setupBucketDailyStorage } from '@/store/slices/dashboard';

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const [isLessThan1200] = useMediaQuery('(max-width: 1200px)');
  useMount(async () => {
    dispatch(setupOwnerAccount());
    dispatch(setupTotalCost());
    dispatch(setupAllCostTrend());
    dispatch(setupPaymentAccounts());
    dispatch(setupBuckets(loginAccount));
    dispatch(setupBucketDailyStorage());
  });

  return (
    <Box h={'100%'}>
      <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
        Dashboard
      </Text>
      {/* height={'calc(100% - 45px)'} */}
      <Flex gap={16} >
        <Flex flexDirection={'column'} gap={16} flex={1} minW={0}>
          <Flex gap={16}>
            <CurMonthCost flex={1} showLink={false} />
            <CurForecastCost flex={1} />
          </Flex>
          {isLessThan1200 && (
            <Flex gap={16}>
              <TotalBalance flex={1} />
              <ToolBox />
            </Flex>
          )}
          <BucketStorageChart />
          <Stats />
        </Flex>
        {!isLessThan1200 && (
          <Flex flexDirection={'column'} gap={16}>
            <TotalBalance />
            <ToolBox />
          </Flex>
        )}
      </Flex>
    </Box>
  );
};
