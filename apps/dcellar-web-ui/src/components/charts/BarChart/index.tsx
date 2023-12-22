import { BaseChart, BaseChartProps } from '@/components/charts/BaseChart';
import { useBarChartOptions } from './useBarChartOptions';

export interface BarChartProps extends BaseChartProps {
  noData: boolean
}

export function BarChart({noData, ...props}: BarChartProps) {
  const { options, ...restProps } = props;
  const finalOptions = useBarChartOptions(options, noData);

  return <BaseChart options={finalOptions} {...restProps} />;
}
