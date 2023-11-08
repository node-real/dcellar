import React, { memo, useMemo } from 'react';
import { CardContainer, CardCost, CardTitle } from './Common';
import { Box, Flex } from '@totejs/uikit';
import { displayTokenSymbol } from '@/utils/wallet';
import { PieChart } from '@/components/charts/PieChart';
import { cssVar } from '@/utils/common';
import { useAppSelector } from '@/store';
import { selectAllCost } from '@/store/slices/billing';
import { BN } from '@/utils/math';
import { TAccountInfo } from '@/store/slices/accounts';
import { formatObjectAddress } from '@/utils/accounts';
import { lgMedia, xlMedia } from '@/modules/welcome';

const colors = ['#009E2C', '#008425', '#005417', '#C2EECE'];

export const TotalCost = memo(() => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { isLoadingPaymentAccounts, accountInfo } = useAppSelector((root) => root.accounts);
  const totalCost = useAppSelector(selectAllCost(loginAccount));
  const { loadingAllCostTrend, loadingAllCost } = useAppSelector((root) => root.billing);
  const pieData = useMemo(() => {
    // TODO use date to judge loading
    if (loadingAllCost || loadingAllCostTrend || isLoadingPaymentAccounts) return;
    const lowerKeyAccountInfo: Record<string, TAccountInfo> = formatObjectAddress(accountInfo)
    const temp = [...(totalCost.detailCosts || [])].sort((a, b) => {
      return BN(b.cost).comparedTo(a.cost);
    });
    const newData = [];
    const others: any = {
      name: 'Others',
      value: '0',
      color: [colors[colors.length - 1]],
      addresses: [],
    };
    for (let i = 0; i < temp.length; i++) {
      if (BN(temp[i]?.cost || 0).isEqualTo(0)) continue;
      if (i < 3) {
        newData.push({
          value: temp[i].cost,
          address: [temp[i].address],
          name: lowerKeyAccountInfo[temp[i]?.address.toLowerCase()]?.name,
          color: colors[i],
        });
      } else {
        others['value'] = BN(others.value).plus(temp[i].cost).toString();
        others['addresses'].push(temp[i].address);
      }
    }
    others.addresses.length > 0 && newData.push(others);
    return newData;
  }, [accountInfo, isLoadingPaymentAccounts, loadingAllCost, loadingAllCostTrend, totalCost.detailCosts]);

  const chartOptions = useMemo(() => {
    const legendNames = (pieData || []).map((item) => ({
      name: item.name,
    }));
    return {
      tooltip: {
        content: (params: any) => {
          const { color, data } = params;
          const styles = getStyles(color);
          return `
            <div style="${styles.box}">
              <div style="${styles.value}">
                ${data.name}:<div style="${styles.bnb}">${data.value} BNB</div>
              </div>
            </div>
          `;
        },
      },
      legend: {
        icon: 'circle',
        itemHeight: 8,
        itemWidth: 8,
        itemGap: 16,
        orient: 'vertical',
        right: 0,
        top: 'center',
        data: legendNames,
      },
      series: [
        {
          data: pieData,
          color: Object.values(colors),
          radius: ['78%', '95%'],
          width: '300px',
          center: ['28%', '50%'],
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }, [pieData]);

  return (
    <CardContainer flex={1} sx={{
      [xlMedia]: {
        maxW: 342
      }
    }}>
      <CardTitle mb={16}>Total Cost</CardTitle>
      <Flex gap={8} mb={8}>
        <CardCost>{totalCost.totalCost}</CardCost>
        <CardCost>{displayTokenSymbol()}</CardCost>
      </Flex>
      <Box width={310} h={176}>
        <PieChart options={chartOptions} />
        {/* <Flex
          mt={24}
          color={'brand.brand6'}
          alignItems={'center'}
          justifyContent={'flex-end'}
          gap={4}
          cursor={'pointer'}
          onClick={() => {}}
        >
          <Text fontWeight={500}>View Detail</Text>
          <IconFont type="forward" />
        </Flex> */}
      </Box>
    </CardContainer>
  );
});

function getStyles(color: string) {
  return {
    box: `
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 14px;
      line-height: 17px;
    `,
    value: `
      display: flex;
      align-items: center;
      color: ${cssVar('readable.secondary')}
      font-size: 12px;
      gap: 4px;
    `,
    bnb: `
      color: ${cssVar('readable.normal')};
      font-weight: 500;
    `,
  };
};
