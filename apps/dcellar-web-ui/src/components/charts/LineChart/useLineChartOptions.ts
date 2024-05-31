import { rgba, useColorMode, useColorModeValue, useTheme } from '@node-real/uikit';
import * as echarts from 'echarts/core';
import { merge } from 'lodash-es';
import { useEffect, useState } from 'react';

import { noDataOptions } from '@/constants/chart';
import { cssVar } from '@/utils/common';

export function useLineChartOptions(options: any, noData: boolean) {
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
      tooltip: {
        trigger: 'axis',
        borderColor: cssVar('readable.border'),
        backgroundColor: cssVar('bg.middle'),
        padding: 8,
        textStyle: {
          color: cssVar('readable.normal'),
          fontSize: 12,
        },
        axisPointer: {
          type: 'line',
          z: -1,
          lineStyle: {
            type: 'solid',
            color: cssVar('readable.disable'),
          },
        },
        extraCssText: `box-shadow: ${cssVar('chartTooltip', 'shadows')};border-radius:4px;`,
        formatter: (params: any) => {
          return `
            <div style="font-family:Inter;font-weight:500;font-size:14px;line-height:24px;">
              ${options.tooltip.content?.(params)}
            </div>
          `;
        },
      },
      grid: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 0,
        containLabel: true,
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        right: 0,
        textStyle: {
          fontWeight: 400,
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        contianerLabel: true,
        axisLabel: {
          marginTop: 4,
          fontWeight: 500,
          lineHeight: 15,
          color: cssVar('readable.disable'),
          fontSize: 10,
          fontFamily: 'Inter',
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: cssVar('readable.chartTick'),
          },
        },
        axisLine: {
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: cssVar('readable.chartTick'),
          },
        },
      },
      yAxis: {
        show: true,
        type: 'value',
        scale: true,
        axisTick: {
          show: true,
          alignWithLabel: true,
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          marginRight: 4,
          fontWeight: 500,
          lineHeight: 15,
          color: cssVar('readable.disabled'),
          fontSize: 12,
          fontFamily: 'Inter',
        },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: rgba('#00BA34', 0.2),
              },
              {
                offset: 1,
                color: rgba('#00BA34', 0),
              },
            ]),
          },
          lineStyle: {
            color: colors.scene.primary.active,
          },
          itemStyle: {
            borderWidth: 1,
            color: colors.bg.middle,
            borderColor: colors.scene.primary.active,
            opacity: 0,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
            },
          },
          animationDuration: 600,
        },
      ],
    };

    // const variantOptions = merge(defaultOptions, detailOptions);
    const finalOptions = merge(defaultOptions, options);

    setFinalOptions(finalOptions);
  }, [colors, options, colorMode, noData]);

  return finalOptions;
}
