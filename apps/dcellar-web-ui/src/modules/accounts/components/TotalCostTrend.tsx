import { useMemo, useRef } from 'react';
import { CardContainer } from './Common';
import { Box } from '@totejs/uikit';
import { BaseChart } from '@/components/charts/BaseChart';
import { cssVar } from '@/utils/common';
import { useAppSelector } from '@/store';
import { MonthlyCost, selectAllCostTrend } from '@/store/slices/billing';
import { getEveryMonth, getUtcDayjs } from '@/utils/time';
import { BN } from '@/utils/math';
import { useTotalEstimateCost } from '../hooks';
import { displayTokenSymbol } from '@/utils/wallet';
import { getMoM, getStyles } from '@/utils/billing';
import { Loading } from '@/components/common/Loading';
import { formatObjectAddress } from '@/utils/accounts';
import { isEmpty } from 'lodash-es';

const colors = ['#00BA34', '#C2EECE', '#1184EE'];

type BarItem = MonthlyCost & {
  MoM: string;
  estimateCost: number;
  month: string;
};
type BarData = BarItem[];

export const TotalCostTrend = () => {
  const dayjs = getUtcDayjs();
  const preDataRef = useRef<any>(null);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const totalCostTrend = useAppSelector(selectAllCostTrend(loginAccount));
  const { loadingAllCostTrend } = useAppSelector((root) => root.billing);
  const { isLoadingPaymentAccounts, isLoadingAccountInfo } = useAppSelector(
    (root) => root.accounts,
  );
  const { curRemainingEstimateCost, nextEstimateCost } = useTotalEstimateCost(['cur', 'next']);
  const { accountInfo } = useAppSelector((root) => root.accounts);
  const barData: BarData = useMemo(() => {
    if (isEmpty(totalCostTrend)) return [];
    let finalData = {};
    const months = getEveryMonth(totalCostTrend.startTime, totalCostTrend.endTime);
    const curYYYYm = dayjs(+new Date()).format('YYYY.M');
    const newData: any = months.map((item, index) => {
      const curMonthBill = totalCostTrend.monthlyCost?.[item.yyyym] || {};
      // the first month
      if (index === 0) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          estimateCost: null,
          MoM: null,
        };
        // before this month
      } else if (dayjs(item.yyyym + '.01').unix() < dayjs(curYYYYm + '.01').unix()) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          estimateCost: null,
          MoM: index === 0 ? 0 : getMoM(preDataRef.current.totalCost, curMonthBill.totalCost),
        };
        // the cur month
      } else if (index === months.length - 2) {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          estimateCost: curRemainingEstimateCost,
          MoM: getMoM(preDataRef.current.totalCost, curMonthBill.totalCost),
        };
        // the coming months
      } else {
        finalData = {
          ...curMonthBill,
          month: item.mmm,
          MoM: null,
          estimateCost: nextEstimateCost,
          totalCost: 0,
        };
      }

      preDataRef.current = finalData;
      return finalData;
    });

    return newData;
  }, [curRemainingEstimateCost, dayjs, nextEstimateCost, totalCostTrend]);

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
      estimateCostData.push(BN(item.estimateCost).abs().toNumber());
      MoMData.push(item.MoM);
    });
    return {
      color: colors,
      title: {
        text: 'Cost Trend',
        textStyle: {
          color: '#1e2026',
          fontSize: 16,
          fontWeight: 700,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any, ticket: string) => {
          const curData = barData[params[0].dataIndex];
          const styles = getStyles();
          const TokenSymbol = displayTokenSymbol();
          let DetailFragment = ``;
          const validDetailBills = (curData.detailBills || []).filter(
            (item) => !BN(item.totalCost).isEqualTo(0),
          );
          const dataLen = validDetailBills.length;
          const displayNum = Math.min(3, dataLen);
          for (let i = 0; i < displayNum; i++) {
            const bill = validDetailBills[i];
            const lowerKeyAccountInfo = formatObjectAddress(accountInfo);
            const accountName = lowerKeyAccountInfo[bill.address.toLowerCase()]?.name;
            if (BN(bill.totalCost).isEqualTo(0)) {
              break;
            }
            DetailFragment += `
              <div style="${styles.normal}">${accountName}: <div style="${styles.bnb}">${bill.totalCost} ${TokenSymbol}</div></div>
            `;
          }
          DetailFragment += dataLen > 3 ? `<div style="${styles.normal}">...</div>` : '';
          const EstimateFragment =
            curData.estimateCost === null
              ? ''
              : `<div style="${styles.normal}">Estimate Cost:<div style="${styles.bnb}">${curData.estimateCost}</div></div>`;
          // const MoMFragment =
          //   curData.MoM === null
          //     ? ''
          //     : `
          //  <div style="${styles.normal}">MoM:<div style="${styles.bnb}">${curData.MoM}%</div></div>`;
          return `
            <div style="${styles.box}">
              <div style="${styles.total}">Total Cost: <div style="${styles.bnb}">${curData.totalCost || 0
            } ${TokenSymbol}</div>
              </div>
              ${DetailFragment}
              ${EstimateFragment}
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
          dataView: { show: true, readOnly: false },
          restore: { show: true },
          saveAsImage: { show: true },
        },
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        right: 30,
        data: ['Monthly Cost', 'Estimate Cost', 'MoM'],
      },
      xAxis: [
        {
          type: 'category',
          axisTick: {
            alignWithLabel: true,
          },
          axisLabel: {
            color: cssVar('readable.tertiary'),
            fontSize: 12,
            transform: 'scale(0.8333)',
            fontWeight: 500,
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
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: cssVar('readable.tertiary'),
            fontSize: 12,
            fontWeight: 500,
            transform: 'scale(0.8333)',
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
        //     formatter: '{value}',
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
  }, [barData, accountInfo]);

  const loading =
    loadingAllCostTrend || isLoadingPaymentAccounts || isLoadingAccountInfo === loginAccount;
  return (
    <CardContainer flex={1}>
      {loading && <Loading />}
      {!loading && (
        <Box w={'100%'} h={'100%'}>
          <BaseChart options={options} />
        </Box>
      )}
    </CardContainer>
  );
};
