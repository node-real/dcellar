import { LineChart } from '@/components/charts/LineChart';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import { FilterContainer } from '@/modules/accounts/components/Common';
import { useAppSelector } from '@/store';
import { selectFilterBuckets } from '@/store/slices/dashboard';
import { formatChartTime, mergeArr } from '@/utils/dashboard';
import { formatBytes } from '@/utils/formatter';
import { getUtcDayjs } from '@/utils/time';
import { Box, Flex } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useMemo } from 'react';
import { LABEL_STYLES, VALUE_STYLES } from '../constants';
import { Card, CardTitle } from './Common';
import { FilterBuckets } from './FilterBuckets';

export const BucketStorageChart = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const filterBuckets = useAppSelector(selectFilterBuckets());
  const bucketDailyStorageRecords = useAppSelector(
    (root) => root.dashboard.bucketDailyStorageRecords,
  );

  const bucketDailyStorage = bucketDailyStorageRecords[loginAccount];
  const isLoading = bucketDailyStorage === undefined;
  const dayjs = getUtcDayjs();
  const noData = !isLoading && isEmpty(bucketDailyStorage);

  const lineOptions = useMemo(() => {
    // line data according to day to generate;
    const data = bucketDailyStorage || [];
    const filterData = isEmpty(filterBuckets)
      ? data
      : data.filter((item) => filterBuckets.includes(item.BucketName));
    let allDailyStorageSize: string[] = [];
    filterData.forEach((item) => {
      if (allDailyStorageSize.length === 0) {
        allDailyStorageSize = [...item.DailyTotalChargedStorageSize];
      } else {
        allDailyStorageSize = mergeArr(allDailyStorageSize, item.DailyTotalChargedStorageSize);
      }
    });
    const now = new Date();
    const DAY_COUNT = allDailyStorageSize.length;
    const lineData = allDailyStorageSize.map((item, index) => {
      const curTime = dayjs(now).subtract(DAY_COUNT - index - 1, 'd');
      const formatTime = curTime.format('DD, MMM');
      const formatSize = formatBytes(item);
      const bytes = item;
      return {
        time: curTime.valueOf(),
        bytes,
        formatTime,
        formatSize,
      };
    });
    const xData = lineData.map((item) => item.formatTime);
    const yData = lineData.map((item) => item.bytes);
    return {
      tooltip: {
        trigger: 'axis',
        content: (params: any) => {
          const { data } = params[0];
          const curData = lineData[params[0].dataIndex];
          return `
            <p ${LABEL_STYLES}>${formatChartTime(curData.time)}</p>
            <p ${VALUE_STYLES}>Storage Size: ${formatBytes(data)}</p>
          `;
        },
      },
      xAxis: {
        data: xData,
      },
      yAxis: {
        axisLabel: {
          formatter: (value: string, index: number) => {
            return formatBytes(value);
          },
        },
      },
      series: [
        {
          data: yData,
        },
      ],
    };
  }, [bucketDailyStorage, dayjs, filterBuckets]);

  return (
    <Card flex={1} gap={24}>
      <Flex alignItems={'center'} justifyContent={'space-between'}>
        <CardTitle>Usage Statistics</CardTitle>
        <Flex>
          <DCButton bgColor={'opacity1'} color={'readable.normal'} _hover={{ bgColor: 'opacity1' }}>
            Storage Usage
          </DCButton>
          <DCButton variant="ghost" disabled={true} border={'none'}>
            Download Quota Usage
          </DCButton>
        </Flex>
      </Flex>
      <FilterContainer>
        <FilterBuckets />
      </FilterContainer>
      <Box h={290} minW={0}>
        <Box w={'100%'} h={'100%'}>
          {isLoading && <Loading />}
          {!isLoading && <LineChart options={lineOptions} noData={noData} />}
        </Box>
      </Box>
    </Card>
  );
};
