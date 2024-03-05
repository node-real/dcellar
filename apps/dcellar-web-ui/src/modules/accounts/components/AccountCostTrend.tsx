import { BarChart } from '@/components/charts/BarChart';
import { Loading } from '@/components/common/Loading';
import { useAppSelector } from '@/store';
import { AccountCostMonth, selectAccountCostTrend } from '@/store/slices/billing';
import { getMoM, getStyles } from '@/utils/billing';
import { BN } from '@/utils/math';
import { getEveryMonth, getUtcDayjs } from '@/utils/time';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { memo, useMemo, useRef } from 'react';
import { useAccountEstimateCost } from '../hooks';
import { CardContainer } from './Common';

const colors = ['#00BA34', '#C2EECE', '#1184EE'];

type BarItem = AccountCostMonth & {
  MoM: string;
  estimateCost: number;
  month: string;
};
type BarData = BarItem[];
type Props = { address: string };

export const AccountCostTrend = memo(function AccountCostTrend({ address }: Props) {
  const preDataRef = useRef<any>(null);
  const dayjs = getUtcDayjs();
  const accountCostTrend = useAppSelector(selectAccountCostTrend(address));
  const { curRemainingEstimateCost, nextEstimateCost } = useAccountEstimateCost(address, [
    'cur',
    'next',
  ]);
  const noData = accountCostTrend?.totalCost === '0';
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
          const TotalFragment = `<div style="${styles.total}">Total Cost: <div style="${
            styles.bnb
          }">${curData.totalCost || 0} ${TokenSymbol}</div>
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
      legend: {
        data: ['Monthly Cost', 'Estimate Cost', 'MoM'],
      },
      xAxis: [
        {
          data: xAxisData,
        },
      ],
      yAxis: [
        {
          axisLabel: {
            formatter: '{value} BNB',
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
          <BarChart options={options} noData={noData} />
        </Box>
      )}
    </CardContainer>
  );
});
