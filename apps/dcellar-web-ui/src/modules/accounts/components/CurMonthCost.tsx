import { useMemo } from 'react';
import { CardContainer, CardCost, CardTime, CardTitle } from './Common';
import { getUtcDayjs } from '@/utils/time';
import { Flex, Text } from '@totejs/uikit';
import { displayTokenSymbol } from '@/utils/wallet';
import { IconFont } from '@/components/IconFont';
import { useAppSelector } from '@/store';

export const CurMonthCost = () => {
  const utcDayjs = getUtcDayjs();
  const { curMonthTotalCosted } = useAppSelector((root) => root.billing);
  const costTime = useMemo(() => {
    const time = +new Date();
    const monthStart = utcDayjs(time).startOf('M').format('YYYY-MM-DD');
    const curTime = utcDayjs(time).format('YYYY-MM-DD');
    return `${monthStart} ~ ${curTime}`;
  }, [utcDayjs]);

  console.log('invoke CurMonthCost');

  return (
    <CardContainer w={260} flex={1}>
      <CardTitle mb={8}>Current Month Cost</CardTitle>
      <CardTime mb={16}>{costTime}</CardTime>
      <Flex gap={8} flexWrap={'wrap'} whiteSpace={'break-spaces'}>
        <CardCost>{curMonthTotalCosted || 0}</CardCost>
        <CardCost>{displayTokenSymbol()}</CardCost>
      </Flex>
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
    </CardContainer>
  );
};
