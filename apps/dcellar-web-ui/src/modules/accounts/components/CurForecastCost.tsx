import { memo, useMemo } from 'react';
import { CardContainer, CardCost, CardTime, CardTitle } from './Common';
import { getUtcDayjs } from '@/utils/time';
import { BoxProps, Flex } from '@node-real/uikit';
import { displayTokenSymbol } from '@/utils/wallet';
import { BN } from '@/utils/math';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useTotalEstimateCost } from '../hooks';

export const CurForecastCost = memo(function CurForecastCost({children, ...restProps}: BoxProps) {
  const dayjs = getUtcDayjs();
  const { curCosted, curRemainingEstimateCost } = useTotalEstimateCost(['cur']);
  const isLoading = curCosted === '' || curRemainingEstimateCost === '';
  const costTime = useMemo(() => {
    const time = +new Date();
    const monthStart = dayjs(time).startOf('M').format('YYYY-MM-DD');
    const curTime = dayjs(time).endOf('M').format('YYYY-MM-DD');
    return `${monthStart} ~ ${curTime}`;
  }, [dayjs]);
  const forecastCost = BN(curCosted || 0)
    .plus(curRemainingEstimateCost || 0)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();
  return (
    <CardContainer w={260} {...restProps}>
      <CardTitle mb={8}>Current Month&apos;s Total Forecast Cost</CardTitle>
      <CardTime mb={16}>{costTime}</CardTime>
      <Flex gap={8}>
        <CardCost>{isLoading ? '--' : forecastCost}</CardCost>
        <CardCost>{displayTokenSymbol()}</CardCost>
      </Flex>
    </CardContainer>
  );
});
