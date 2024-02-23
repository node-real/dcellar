import ReactEChartsCore from 'echarts-for-react/lib/core';
import {
  BarChart as EChartBarChart,
  LineChart as EChartLineChart,
  PieChart as EChartPieChart,
} from 'echarts/charts';
import {
  GridComponent,
  GridSimpleComponent,
  LegendComponent,
  SingleAxisComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  EChartPieChart,
  EChartBarChart,
  EChartLineChart,
  TooltipComponent,
  ToolboxComponent,
  GridSimpleComponent,
  SingleAxisComponent,
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
