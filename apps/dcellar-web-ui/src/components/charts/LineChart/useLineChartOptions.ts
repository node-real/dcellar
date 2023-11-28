import { rgba, useColorMode, useColorModeValue, useTheme } from '@totejs/uikit';
import { useEffect, useState } from 'react';
import {merge} from 'lodash-es';
import * as echarts from 'echarts/core';

import { cssVar } from '@/utils/common';
import { formatChartXAxisTime } from '@/utils/chart';
import { noDataOptions } from '@/constants/chart';

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
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLabel: {
          marginTop: 4,
          fontWeight: 500,
          lineHeight: 15,
          color: cssVar('readable.disable'),
          fontSize: 10,
          fontFamily: 'Inter',
          formatter: formatChartXAxisTime,
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
        spiltLine: {
          lineStyle: {
            color: 'red',
          }
        },
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
      grid: {
        left: 4,
        right: 20,
        top: 6,
        bottom: 0,
        containLabel: true,
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
