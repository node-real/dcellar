import { LineChart } from '@/components/charts/LineChart';
import { Loading } from '@/components/common/Loading';
import { FilterContainer } from '@/modules/accounts/components/Common';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectFilterBuckets, setBucketFilter } from '@/store/slices/dashboard';
import { formatChartTime, mergeArr } from '@/utils/dashboard';
import { formatBytes } from '@/utils/formatter';
import { getUtcDayjs } from '@/utils/time';
import { Box, Flex } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useMemo } from 'react';
import { LABEL_STYLES, VALUE_STYLES } from '../constants';
import { BucketsFilter } from './BucketsFilter';

export const BucketStorageUsage = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const filterBuckets = useAppSelector(selectFilterBuckets());
  const bucketDailyStorageRecords = useAppSelector(
    (root) => root.dashboard.bucketDailyStorageUsageRecords,
  );
  const bucketDailyStorage = bucketDailyStorageRecords[loginAccount];
  const isLoading = bucketDailyStorage === undefined;
  const bucketNames = !isLoading ? bucketDailyStorage.map((item) => item.BucketName) : [''];
  const dayjs = getUtcDayjs();
  const noData = !isLoading && isEmpty(bucketDailyStorage);
  const onBucketFiltered = (bucketNames: string[]) => {
    dispatch(setBucketFilter({ loginAccount, bucketNames }));
  };

  const lineOptions = useMemo(() => {
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
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        right: 12,
        textStyle: { fontWeight: 400 },
        data: ['Storage Usage', 'Quota Usage'],
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
          symbolSize: 5,
          lineStyle: { color: '#00BA34' },
          itemStyle: {
            color: '#00BA34',
            opacity: 1,
          },
          emphasis: { itemStyle: { opacity: 1 } },
          animationDuration: 600,
          name: 'Storage Usage',
          type: 'line',
          smooth: false,
          stack: 'Storage Usage',
          data: yData,
        },
      ],
    };
  }, [bucketDailyStorage, dayjs, filterBuckets]);

  return (
    <Flex gap={12} flexDirection={'column'}>
      <FilterContainer>
        <BucketsFilter
          filteredBuckets={filterBuckets}
          bucketNames={bucketNames}
          onBucketFiltered={onBucketFiltered}
        />
      </FilterContainer>
      <Box h={290} minW={0}>
        <Box w={'100%'} h={'100%'}>
          {isLoading && <Loading />}
          {!isLoading && <LineChart options={lineOptions} noData={noData} />}
        </Box>
      </Box>
    </Flex>
  );
};
