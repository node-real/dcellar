import { useMemo } from 'react';
import { CardContainer, CardCost, CardTime, CardTitle } from './Common';
import { getUtcDayjs } from '@/utils/time';
import { BoxProps, Flex, Text } from '@totejs/uikit';
import { displayTokenSymbol } from '@/utils/wallet';
import { useAppSelector } from '@/store';
import { IconFont } from '@/components/IconFont';
import { InternalRoutePaths } from '@/utils/constant';
import { stringify } from 'querystring';
import { BillingHistoryQuery } from '..';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { scrollToId } from '@/utils/common';

type CurMonthCostProps = BoxProps & {
  showLink?: boolean;
};
export const CurMonthCost = ({ children, showLink = true, ...restProps }: CurMonthCostProps) => {
  const utcDayjs = getUtcDayjs();
  const router = useRouter();
  const { curMonthTotalCosted } = useAppSelector((root) => root.billing);
  console.log('curMonthTotalCosted', curMonthTotalCosted);
  const costTime = useMemo(() => {
    const time = +new Date();
    const monthStart = utcDayjs(time).startOf('M').format('YYYY-MM-DD');
    const curTime =
      utcDayjs(time).format('YYYY-MM-DD') !== utcDayjs(time).startOf('M').format('YYYY-MM-DD')
        ? utcDayjs(time).subtract(1, 'd').format('YYYY-MM-DD')
        : utcDayjs(time).format('YYYY-MM-DD');
    return `${monthStart} ~ ${curTime}`;
  }, [utcDayjs]);

  const onBillingHistory = () => {
    const curQuery: BillingHistoryQuery = {
      page: 1,
      tab: 'b',
      from: dayjs().startOf('M').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD'),
    };
    const url = `${InternalRoutePaths.accounts}?${stringify(curQuery)}`;
    router.push(url, undefined, { scroll: false });
    scrollToId('tab_container', 24);
  };
  const isLoading = curMonthTotalCosted === '';

  return (
    <CardContainer w={260} flex={1} {...restProps}>
      <CardTitle mb={8}>Current Month Cost</CardTitle>
      <CardTime mb={16}>{costTime}</CardTime>
      <Flex gap={8} flexWrap={'wrap'} whiteSpace={'break-spaces'}>
        <CardCost>
            {isLoading ? '--' : curMonthTotalCosted}
        </CardCost>
        <CardCost>{displayTokenSymbol()}</CardCost>
      </Flex>
      {showLink && (
        <Flex
          mt={16}
          color={'brand.brand6'}
          alignItems={'center'}
          justifyContent={'flex-end'}
          gap={4}
          cursor={'pointer'}
          onClick={() => {
            onBillingHistory();
          }}
        >
          <Text fontWeight={500}>View Detail</Text>
          <IconFont type="forward" />
        </Flex>
      )}
    </CardContainer>
  );
};
