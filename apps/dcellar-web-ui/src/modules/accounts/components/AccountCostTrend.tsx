import { memo, useMemo, useRef } from 'react';
import { CardContainer } from './Common';
import { Box } from '@totejs/uikit';
import { BaseChart } from '@/components/charts/BaseChart';
import { cssVar } from '@/utils/common';
import { useAppSelector } from '@/store';
import { AccountCostMonth, selectAccountCostTrend } from '@/store/slices/billing';
import { getEveryMonth, getUtcDayjs } from '@/utils/time';
import { BN } from '@/utils/math';
import { useAccountEstimateCost } from '../hooks';
import { displayTokenSymbol } from '@/utils/wallet';
import { getMoM, getStyles } from '@/utils/billing';
import { isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';

const colors = ['#00BA34', '#C2EECE', '#1184EE'];

type BarItem = AccountCostMonth & {
  MoM: string;
  estimateCost: number;
  month: string;
};
type BarData = BarItem[];
type Props = {
  address: string;
};
export const AccountCostTrend = memo(({ address }: Props) => {
  const preDataRef = useRef<any>(null);
  const dayjs = getUtcDayjs();
  const accountCostTrend = useAppSelector(selectAccountCostTrend(address));
  const { curRemainingEstimateCost, nextEstimateCost } = useAccountEstimateCost(address, [
    'cur',
    'next',
  ]);
  const barData: BarData = useMemo(() => {
    if (isEmpty(accountCostTrend)) return [];
    let finalData = {};
    const months = getEveryMonth(accountCostTrend.startTime, accountCostTrend.endTime);
    const curYYYYm = dayjs(+new Date()).format('YYYY-M');
    const newData: any = months.map((item, index) => {
      const curMonthBill = accountCostTrend.monthlyCost?.[item.yyyym] || {};
      // the first month
      if (index === 0) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          time: item.yyyym,
          estimateCost: null,
          MoM: null,
        };
        // before this month
      } else if (dayjs(item.yyyym + '-01').valueOf() < dayjs(curYYYYm + '-01').valueOf()) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          time: item.yyyym,
          estimateCost: null,
          MoM: index === 0 ? 0 : getMoM(preDataRef.current.totalCost, curMonthBill.totalCost),
        };
        // the current month
      } else if (dayjs(item.yyyym + '-01').valueOf() === dayjs(curYYYYm + '-01').valueOf()) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          time: item.yyyym,
          estimateCost: curRemainingEstimateCost,
          MoM: getMoM(preDataRef.current.totalCost, curMonthBill.totalCost),
        };
        // the coming months
      } else {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          time: item.yyyym,
          MoM: null,
          estimateCost: nextEstimateCost,
          totalCost: 0,
        };
      }

      preDataRef.current = finalData;
      return finalData;
    });

    return newData;
  }, [accountCostTrend, curRemainingEstimateCost, dayjs, nextEstimateCost]);

  const options = useMemo(() => {
    const xAxisData: string[] = [];
    const monthlyCostData: number[] = [];
    const estimateCostData: number[] = [];
    const MoMData: number[] = [];
    barData.forEach((item: any) => {
      xAxisData.push(item.month);
      monthlyCostData.push(
        BN(item.totalCost || 0)
          .abs()
          .toNumber(),
      );
      estimateCostData.push(
        BN(item.estimateCost || 0)
          .abs()
          .toNumber(),
      );
      MoMData.push(item.MoM);
    });
    return {
      color: colors,
      title: {
        text: 'Cost Trend',
        textStyle: {
          color: cssVar('readable.normal'),
          fontSize: 16,
          fontWeight: 700,
        },
        left: 0,
        padding: [5, 5, 5, 0],
        textAlign: 'left',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any, ticket: string) => {
          const curData = barData[params[0].dataIndex];
          const styles = getStyles();
          const TokenSymbol = displayTokenSymbol();
          const TotalFragment = `<div style="${styles.total}">Total Cost: <div style="${styles.bnb}">${curData.totalCost || 0} ${TokenSymbol}</div>
          </div>`;
          const EstimateFragment =
            curData.estimateCost === null
              ? ''
              : `
          <div style="${styles.normal}">Estimate Cost:<div style="${styles.bnb}">${curData.estimateCost} ${TokenSymbol}</div>
          </div>
          `;
          // const MoMFragment =
          //   curData.MoM === null
          //     ? ''
          //     : `<div style="${styles.normal}">MoM:<div style="${styles.bnb}">${curData.MoM}%</div></div>`;
          return `
            <div style="${styles.box}">
              ${TotalFragment}
              ${EstimateFragment}
              </div>
            </div>`;
        },
      },
      grid: {
        containLabel: true,
        left: 'left',
        right: '0%',
        bottom: '0%',
      },
      toolbox: {
        feature: {
          dataView: { show: false, readOnly: false },
          restore: { show: false },
          saveAsImage: { show: false },
        },
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        right: 0,
        data: ['Monthly Cost', 'Estimate Cost', 'MoM'],
        textStyle: {
          fontWeight: 400,
        }
      },
      xAxis: [
        {
          type: 'category',
          axisTick: {
            show: true,
            alignWithLabel: true,
            lineStyle: {
              color: cssVar('bg.bottom'),
            },
          },
          axisLabel: {
            color: cssVar('readable.tertiary'),
            fontSize: 12,
            fontWeight: 500,
            margin: 16,
            lineHeight: 12,
          },
          axisLine: {
            show: false,
            margin: 18,
          },
          axisPointer: {
            lineStyle: {
              color: cssVar('readable.secondary'),
              type: 'solid',
            },
          },
          data: xAxisData,
        },
      ],
      yAxis: [
        {
          type: 'value',
          // name: 'Monthly Cost',
          position: 'left',
          alignTicks: true,
          splitNumber: 5,
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: cssVar('readable.tertiary'),
            fontSize: 12,
            fontWeight: 500,
            formatter: '{value} BNB',
          },
          splitLine: {
            lineStyle: {
              color: cssVar('bg.bottom'),
            },
          },
        },
        // {
        //   type: 'value',
        //   // name: 'MoM',
        //   position: 'right',
        //   alignTicks: true,
        //   axisLine: {
        //     show: false,
        //   },
        //   axisLabel: {
        //     formatter: '{value} %',
        //   },
        // },
      ],
      series: [
        {
          name: 'Monthly Cost',
          type: 'bar',
          stack: 'Monthly Cost',
          data: monthlyCostData,
        },
        {
          name: 'Estimate Cost',
          type: 'bar',
          stack: 'Monthly Cost',
          data: estimateCostData,
        },
        // {
        //   name: 'MoM',
        //   type: 'line',
        //   yAxisIndex: 1,
        //   data: MoMData,
        // },
      ],
    };
  }, [barData]);
  const loading = isEmpty(barData);
  return (
    <CardContainer flex={1} width={'50%'} minW={478} minH={283}>
      {loading && <Loading />}
      {!loading && (
        <Box w={'100%'} h={'100%'}>
          <BaseChart options={options} />
        </Box>
      )}
    </CardContainer>
  );
});
