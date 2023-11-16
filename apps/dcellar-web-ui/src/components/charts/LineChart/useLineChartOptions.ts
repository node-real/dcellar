import { rgba, useColorMode, useColorModeValue, useTheme } from '@totejs/uikit';
import { useEffect, useState } from 'react';
import {merge} from 'lodash-es';
import * as echarts from 'echarts/core';

import { cssVar } from '@/utils/common';

export function useLineChartOptions(options: any) {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const colors = useColorModeValue(theme.colors.light, theme.colors.dark);

  const [finalOptions, setFinalOptions] = useState({});

  useEffect(() => {
    if (colorMode !== document.documentElement.dataset.theme) {
      return;
    }
    const defaultOptions = {
      tooltip: {
        trigger: 'axis',
        borderColor: cssVar('readable.border'),
        backgroundColor: cssVar('bg.middle'),
        padding: 8,
        textStyle: {
          color: cssVar('readable.normal'),
        },
        axisPointer: {
          type: 'line',
          z: -1,
          lineStyle: {
            color: cssVar('readable.secondary'),
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
          margin: 7,
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 14,
          fontFamily: 'Inter',
          color: cssVar('readable.secondary'),
        },
        axisLine: {
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        scale: true,
        splitLine: {
          lineStyle: {
            color: cssVar('readable.border'),
          },
        },
        axisLabel: {
          margin: 4,
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 14,
          fontFamily: 'Inter',
          color: cssVar('readable.secondary'),
        },
      },
      grid: {
        left: 6,
        right: 18,
        top: 6,
        bottom: 0,
        containLabel: true,
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
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
            color: colors.bg.middle,
            borderWidth: 2,
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

    const finalOptions = merge(defaultOptions, options);
    setFinalOptions(finalOptions);
  }, [colors, options, colorMode]);

  return finalOptions;
}
