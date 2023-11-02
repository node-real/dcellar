import { useEffect, useState } from 'react';
import { merge } from 'lodash-es';

import { cssVar } from '@/utils/common';

export function usePieChartOptions(options: any) {
  const [finalOptions, setFinalOptions] = useState({});

  useEffect(() => {
    const defaultOptions = {
      tooltip: {
        trigger: 'item',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        padding: 0,
        extraCssText: 'box-shadow: none;',
        formatter: (params: any) => {
          const { color } = params;

          const style = `
            font-family: Inter;
            font-weight: 500;
            line-height: 24px;
            border-radius: 4px;
            outline: 1px solid ${cssVar('readable.border')};
            padding: 8px;
            box-shadow: ${cssVar('chartTooltip', 'shadows')};
            background-color: ${cssVar(`bg.middle`)}
          `;

          return `
            <div style="${style}">
              ${options.tooltip?.content?.(params)}
            </div>
          `;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: false,
            },
          },
          itemStyle: {},
          animationDuration: 600,
        },
      ],
    };

    const finalOptions = merge(defaultOptions, options);
    setFinalOptions(finalOptions);
  }, [options]);

  return finalOptions;
}
