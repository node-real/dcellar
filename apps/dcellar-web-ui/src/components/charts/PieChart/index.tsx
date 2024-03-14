import { usePieChartOptions } from '@/components/charts/PieChart/usePieChartOptions';
import { BaseChart, BaseChartProps } from '../BaseChart';

export interface PieChartProps extends BaseChartProps {}

export function PieChart(props: PieChartProps) {
  const { options } = props;
  const finalOptions = usePieChartOptions(options);

  return <BaseChart options={finalOptions} />;
}
