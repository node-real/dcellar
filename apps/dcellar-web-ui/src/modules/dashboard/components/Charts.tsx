import { useMemo } from 'react';
import { Card, CardTitle } from './Common';
import { LineChart } from '@/components/charts/LineChart';
import { formatChartTime } from '@/utils/dashboard';
import { Box, Flex } from '@totejs/uikit';
import { DCButton } from '@/components/common/DCButton';
import { FilterBuckets } from './FilterBuckets';
import { FilterContainer } from '@/modules/accounts/components/Common';

export const Charts = () => {
  const lineOptions = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        content: (params: any) => {
          const { name, data } = params[0];
          return `
            <p>${formatChartTime(name)}</p>
          `;
        },
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        orient: 'vertical',
        right: 0,
        top: 'center',
        data: ['Storage Usage'],
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330, 1320],
          type: 'line',
          areaStyle: {},
        },
      ],
    };
  }, []);
  return (
    <Card flex={1} gap={24}>
      <Flex alignItems={'center'} justifyContent={'space-between'}>
        <CardTitle>Usage Statics</CardTitle>
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
          <LineChart options={lineOptions} />
        </Box>
      </Box>
    </Card>
  );
};
