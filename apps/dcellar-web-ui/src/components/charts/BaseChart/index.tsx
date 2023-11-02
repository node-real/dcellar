import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart as EChartLineChart } from 'echarts/charts';
import { PieChart as EChartPieChart } from 'echarts/charts';
import { BarChart as EChartBarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  EChartPieChart,
  EChartBarChart,
  EChartLineChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  SVGRenderer,
]);

export interface BaseChartProps {
  options: any;
}

export function BaseChart(props: BaseChartProps) {
  const { options } = props;
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={options}
      notMerge={true}
      lazyUpdate={true}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
