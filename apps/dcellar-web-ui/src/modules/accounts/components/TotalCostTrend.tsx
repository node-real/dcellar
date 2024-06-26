import { BarChart } from '@/components/charts/BarChart';
import { Loading } from '@/components/common/Loading';
import { useAppSelector } from '@/store';
import { MonthlyCost, selectAllCostTrend } from '@/store/slices/billing';
import { formatObjectAddress } from '@/utils/accounts';
import { getMoM, getStyles } from '@/utils/billing';
import { BN } from '@/utils/math';
import { getEveryMonth, getUtcDayjs } from '@/utils/time';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useMemo, useRef } from 'react';
import { useTotalEstimateCost } from '../hooks';
import { CardContainer } from './Common';

const COLOR_PALETTE = ['#00BA34', '#C2EECE', '#1184EE'];

type BarItem = MonthlyCost & {
  MoM: string;
  estimateCost: number;
  month: string;
};

type BarData = BarItem[];

export const TotalCostTrend = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const costTrendLoading = useAppSelector((root) => root.billing.costTrendLoading);
  const paymentAccountsLoading = useAppSelector((root) => root.accounts.paymentAccountsLoading);
  const accountInfoLoading = useAppSelector((root) => root.accounts.accountInfoLoading);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);

  const totalCostTrend = useAppSelector(selectAllCostTrend(loginAccount));
  const preDataRef = useRef<any>(null);
  const { curRemainingEstimateCost, nextEstimateCost } = useTotalEstimateCost(['cur', 'next']);

  const noData = totalCostTrend.totalCost === '0';
  const dayjs = getUtcDayjs();
  const loading = costTrendLoading || paymentAccountsLoading || accountInfoLoading === loginAccount;

  const barData: BarData = useMemo(() => {
    if (isEmpty(totalCostTrend)) return [];
    let finalData = {};
    const months = getEveryMonth(totalCostTrend.startTime, totalCostTrend.endTime);
    const curYYYYm = dayjs(+new Date()).format('YYYY-M');
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
      } else if (dayjs(item.yyyym + '-01').unix() < dayjs(curYYYYm + '-01').unix()) {
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
      color: COLOR_PALETTE,
      title: {
        text: 'Cost Trend',
      },
      tooltip: {
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
            const lowerKeyAccountInfo = formatObjectAddress(accountInfos);
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
              : `<div style="${styles.normal}">Estimate Cost:<div style="${styles.bnb}">${curData.estimateCost} ${TokenSymbol}</div></div>`;
          // const MoMFragment =
          //   curData.MoM === null
          //     ? ''
          //     : `
          //  <div style="${styles.normal}">MoM:<div style="${styles.bnb}">${curData.MoM}%</div></div>`;
          return `
            <div style="${styles.box}">
              <div style="${styles.total}">Total Cost: <div style="${styles.bnb}">${
                curData.totalCost || 0
              } ${TokenSymbol}</div>
              </div>
              ${DetailFragment}
              ${EstimateFragment}
            </div>`;
        },
      },
      legend: {
        data: ['Monthly Cost', 'Estimate Cost'],
      },
      xAxis: [
        {
          type: 'category',
          data: xAxisData,
        },
      ],
      yAxis: [
        {
          axisLabel: {
            formatter: '{value} BNB',
          },
        },
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
  }, [barData, accountInfos]);

  return (
    <CardContainer flex={1} minW={478} minH={283}>
      {loading && <Loading />}
      {!loading && (
        <Box w={'100%'} h={'100%'}>
          <BarChart options={options} noData={noData} />
        </Box>
      )}
    </CardContainer>
  );
};
