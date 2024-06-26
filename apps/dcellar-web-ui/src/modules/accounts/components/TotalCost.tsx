import { IconFont } from '@/components/IconFont';
import { PieChart } from '@/components/charts/PieChart';
import { InternalRoutePaths } from '@/constants/paths';
import { xlMedia } from '@/modules/welcome';
import { useAppSelector } from '@/store';
import { AccountInfo } from '@/store/slices/accounts';
import { selectAllCost } from '@/store/slices/billing';
import { formatObjectAddress } from '@/utils/accounts';
import { cssVar, scrollToId } from '@/utils/common';
import { BN } from '@/utils/math';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box, Flex, Text } from '@node-real/uikit';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { memo, useMemo } from 'react';
import { BillingHistoryQuery } from '..';
import { CardContainer, CardCost, CardTitle } from './Common';

const colors = ['#009E2C', '#008425', '#005417', '#C2EECE'];

export const TotalCost = memo(function TotalCost() {
  const router = useRouter();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const paymentAccountsLoading = useAppSelector((root) => root.accounts.paymentAccountsLoading);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const costTrendLoading = useAppSelector((root) => root.billing.costTrendLoading);
  const costLoading = useAppSelector((root) => root.billing.costLoading);
  const totalCost = useAppSelector(selectAllCost(loginAccount));

  const pieData = useMemo(() => {
    // TODO use date to judge loading
    if (costLoading || costTrendLoading || paymentAccountsLoading) return;
    const lowerKeyAccountInfo: Record<string, AccountInfo> = formatObjectAddress(accountInfos);
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
  }, [accountInfos, paymentAccountsLoading, costLoading, costTrendLoading, totalCost.detailCosts]);

  const chartOptions = useMemo(() => {
    const legendNames = (pieData || []).map((item) => ({
      name: item.name,
    }));
    return {
      tooltip: {
        content: (params: any) => {
          const { data } = params;
          const styles = getStyles();
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
          radius: ['73%', '90%'],
          width: '300px',
          center: ['28%', '50%'],
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }, [pieData]);

  const onBillingHistory = () => {
    const curQuery: BillingHistoryQuery = {
      page: 1,
      tab: 'b',
    };
    const url = `${InternalRoutePaths.accounts}?${stringify(curQuery)}`;
    router.push(url, undefined, { scroll: false });
    scrollToId('tab_container', 24);
  };

  return (
    <CardContainer
      flex={1}
      sx={{
        [xlMedia]: {
          maxW: 342,
        },
      }}
    >
      <CardTitle mb={16}>Total Cost</CardTitle>
      <Flex gap={8} mb={8}>
        <CardCost>{totalCost.totalCost}</CardCost>
        <CardCost>{displayTokenSymbol()}</CardCost>
      </Flex>
      <Box width={310} h={176}>
        <PieChart options={chartOptions} />
        <Flex
          mt={16}
          color={'brand.brand6'}
          alignItems={'center'}
          justifyContent={'flex-end'}
          gap={4}
          cursor={'pointer'}
          onClick={onBillingHistory}
        >
          <Text fontWeight={500}>View Detail</Text>
          <IconFont type="forward" />
        </Flex>
      </Box>
    </CardContainer>
  );
});

function getStyles() {
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
}
