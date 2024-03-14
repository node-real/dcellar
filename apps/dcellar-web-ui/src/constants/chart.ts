import { cssVar } from '@/utils/common';

export const noDataOptions = {
  title: {
    show: true,
    textStyle: {
      color: cssVar('readable.secondary'),
      fontSize: 16,
      fontWeight: 500,
    },
    text: 'No data',
    left: 'center',
    top: 'center',
  },
  xAxis: {
    show: false,
  },
  yAxis: {
    show: false,
  },
};
