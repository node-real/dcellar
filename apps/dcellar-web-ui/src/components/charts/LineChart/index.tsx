import { BaseChart, BaseChartProps } from '@/components/charts/BaseChart';
import { useLineChartOptions } from '@/components/charts/LineChart/useLineChartOptions';

export interface LineChartProps extends BaseChartProps {
  noData: boolean
}

export function LineChart({noData, ...props}: LineChartProps) {
  const { options, ...restProps } = props;
  const finalOptions = useLineChartOptions(options, noData);

  return <BaseChart options={finalOptions} {...restProps} />;
}
