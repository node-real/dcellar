import { BaseChart, BaseChartProps } from '@/components/charts/BaseChart';
import { useLineChartOptions } from '@/components/charts/LineChart/useLineChartOptions';

export interface LineChartProps extends BaseChartProps {}

export function LineChart(props: LineChartProps) {
  const { options } = props;
  const finalOptions = useLineChartOptions(options);

  return <BaseChart options={finalOptions} />;
}
