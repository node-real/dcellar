import { useColorMode, useColorModeValue, useTheme } from '@totejs/uikit';
import { useEffect, useState } from 'react';
import {merge} from 'lodash-es';
import { cssVar } from '@/utils/common';
import { noDataOptions } from '@/constants/chart';

export function useBarChartOptions(options: any, noData: boolean) {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const colors = useColorModeValue(theme.colors.light, theme.colors.dark);

  const [finalOptions, setFinalOptions] = useState({});

  useEffect(() => {
    if (colorMode !== document.documentElement.dataset.theme) {
      return;
    }
    if (noData) {
      return setFinalOptions(noDataOptions);
    }
    const defaultOptions = {
      title: {
        text: 'Cost Trend',
        textStyle: {
          color: cssVar('readable.normal'),
          fontSize: 16,
          fontWeight: 700,
        },
        left: 0,
        padding: [5, 5, 5, 0],
        textAlign: 'left',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        containLabel: true,
        left: 'left',
        right: '0%',
        bottom: '0%',
      },
      toolbox: {
        feature: {
          dataView: { show: false, readOnly: false },
          restore: { show: false },
          saveAsImage: { show: false },
        },
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        right: 30,
        // data: ['Monthly Cost', 'Estimate Cost'],
        textStyle: {
          fontWeight: 400,
        },
      },
      xAxis: [{
        type: 'category',
        axisTick: {
          show: true,
          alignWithLabel: true,
          lineStyle: {
            color: cssVar('bg.bottom'),
          },
        },
        axisLabel: {
          color: cssVar('readable.tertiary'),
          fontSize: 12,
          fontWeight: 500,
          margin: 16,
          lineHeight: 12,
        },
        axisLine: {
          show: false,
          margin: 18,
        },
        axisPointer: {
          lineStyle: {
            color: cssVar('readable.secondary'),
            type: 'solid',
          },
        },
      }],
      yAxis: [{
        type: 'value',
        position: 'left',
        alignTicks: true,
        splitNumber: 5,
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: cssVar('readable.tertiary'),
          fontSize: 12,
          fontWeight: 500,
          formatter: '{value} BNB',
        },
        splitLine: {
          lineStyle: {
            color: cssVar('bg.bottom'),
          },
        },
      }],
      series: [
      ],
    };

    const finalOptions = merge(defaultOptions, options);

    setFinalOptions(finalOptions);
  }, [colors, options, colorMode, noData]);

  return finalOptions;
}
