import { LineChart } from '@/components/charts/LineChart';
import { Loading } from '@/components/common/Loading';
import { FilterContainer } from '@/modules/accounts/components/Common';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketDailyQuotaFilter } from '@/store/slices/dashboard';
import { formatChartTime, mergeArr } from '@/utils/dashboard';
import { formatBytes } from '@/utils/formatter';
import { getMillisecond, getUtcDayjs } from '@/utils/time';
import { Box, Flex } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useMemo } from 'react';
import { LABEL_STYLES, VALUE_STYLES } from '../constants';
import {
  selectBucketDailyQuotaUsage,
  selectFilterQuotaUsageBuckets,
} from '@/store/slices/dashboard';
import { BN } from '@/utils/math';
import { BucketsFilter } from './BucketsFilter';

export const BucketQuotaUsage = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bucketDailyQuotaUsage = useAppSelector(selectBucketDailyQuotaUsage());
  const filteredBuckets = useAppSelector(selectFilterQuotaUsageBuckets());
  const isLoading = bucketDailyQuotaUsage === undefined;
  const dayjs = getUtcDayjs();
  const noData = !isLoading && isEmpty(bucketDailyQuotaUsage);
  const bucketNames = Object.keys(bucketDailyQuotaUsage);

  const onBucketFiltered = (bucketNames: string[]) => {
    dispatch(setBucketDailyQuotaFilter({ loginAccount, bucketNames }));
  };

  const quotaUsageByTime = useMemo(() => {
    const data = bucketDailyQuotaUsage || {};
    const filterData = isEmpty(filteredBuckets)
      ? data
      : filteredBuckets.map((item) => data[item]).filter((item) => item !== undefined);
    const quotaUsageByTime: Record<
      string,
      { MonthlyQuotaSize: string; MonthlyQuotaConsumedSize: string }
    > = {};
    Object.values(filterData).forEach((quotaUsages) => {
      quotaUsages.forEach((item) => {
        if (!quotaUsageByTime[item.Date]) {
          return (quotaUsageByTime[item.Date] = {
            MonthlyQuotaSize: String(item.MonthlyQuotaSize),
            MonthlyQuotaConsumedSize: String(item.MonthlyQuotaConsumedSize),
          });
        }
        quotaUsageByTime[item.Date] = {
          MonthlyQuotaSize: BN(quotaUsageByTime[item.Date].MonthlyQuotaSize)
            .plus(item.MonthlyQuotaSize)
            .toString(),
          MonthlyQuotaConsumedSize: BN(quotaUsageByTime[item.Date].MonthlyQuotaConsumedSize)
            .plus(BN(item.MonthlyQuotaConsumedSize))
            .toString(),
        };
      });
    });
    return quotaUsageByTime;
  }, [bucketDailyQuotaUsage, filteredBuckets]);

  const lineOptions = useMemo(() => {
    const lineData = Object.entries(quotaUsageByTime).map(([time, quotaData]) => ({
      time: getMillisecond(+time),
      totalQuota: quotaData.MonthlyQuotaSize,
      quotaUsage: quotaData.MonthlyQuotaConsumedSize,
      formatTime: dayjs(getMillisecond(+time)).format('DD, MMM'),
      formatSize: formatBytes(quotaData.MonthlyQuotaSize),
    }));
    const xData = lineData.map((item) => item.formatTime);
    const yQuotaUsage = lineData.map((item) => item.quotaUsage);
    const yTotalQuota = lineData.map((item) => item.totalQuota);

    return {
      tooltip: {
        trigger: 'axis',
        content: (params: any) => {
          const { data: quotaUsage } =
            params.find((item: any) => item.seriesName === 'Quota Usage') || {};
          const { data: totalQuota } =
            params.find((item: any) => item.seriesName === 'Total Quota') || {};
          const curData = lineData[params[0].dataIndex] || {};

          const TotalQuotaFragment =
            totalQuota !== undefined
              ? ` <p ${VALUE_STYLES}>Total Quota: ${formatBytes(totalQuota)}</p>`
              : '';
          const QuotaUsageFragment =
            quotaUsage !== undefined
              ? `<p ${VALUE_STYLES}>Quota Usage: ${formatBytes(quotaUsage)}</p>`
              : '';
          return `
            <p ${LABEL_STYLES}>${formatChartTime(curData.time)}</p>
            ${TotalQuotaFragment}
            ${QuotaUsageFragment}
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
        data: ['Total Quota', 'Quota Usage'],
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
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#00BA34' },
          itemStyle: {
            color: '#00BA34',
            opacity: 1,
          },
          smooth: false,
          name: 'Quota Usage',
          type: 'line',
          stack: 'Quota Usage',
          data: yQuotaUsage,
        },
        {
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#EE7C11' },
          itemStyle: {
            color: '#EE7C11',
          },
          emphasis: { itemStyle: { opacity: 1 } },
          animationDuration: 600,
          smooth: false,
          name: 'Total Quota',
          type: 'line',
          stack: 'Total Quota',
          data: yTotalQuota,
        },
      ],
    };
  }, [quotaUsageByTime, dayjs]);

  return (
    <Flex gap={12} flexDirection={'column'}>
      <FilterContainer>
        <BucketsFilter
          bucketNames={bucketNames}
          filteredBuckets={filteredBuckets}
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
