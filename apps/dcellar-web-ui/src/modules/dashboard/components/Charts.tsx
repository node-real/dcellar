import { useMemo } from 'react';
import { Card } from './Common';
import { LineChart } from '@/components/charts/LineChart';
import { formatChartTime } from '@/utils/dashboard';
import { Box } from '@totejs/uikit';

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
    <Box flex={1}>
      <Card h={'100%'} maxH={390} minW={0}>
        <Box w={'100%'} h={'100%'}>
          <LineChart options={lineOptions} />
        </Box>
      </Card>
    </Box>
  );
};
