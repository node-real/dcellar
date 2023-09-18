import { DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { BN } from '@/utils/BigNumber';
import { currencyFormatter } from '@/utils/currencyFormatter';
import { Flex, Text, Box } from '@totejs/uikit';
import React from 'react';
import { displayUsd } from './Calculator';
import { TTimeOption } from '../utils';

type FeeItemProps = {
  title: string;
  size: string;
  unit: string;
  storeTime: string;
  fee: string;
  bnbPrice: string;
};
export const FeeItem = ({ title, size, unit, fee, storeTime, bnbPrice }: FeeItemProps) => (
  <Flex alignItems={'center'} justifyContent={'space-between'}>
    <Flex alignItems={'center'}>
      <Text fontSize={16} fontWeight={600} minW={160}>
        {title}
      </Text>
      <Text>
        {size.replace(/^0+/, '') || 0} {unit}
      </Text>
      <Text>&nbsp;X&nbsp;</Text>
      <Text whiteSpace={'nowrap'}>{storeTime}</Text>
    </Flex>
    <Box textAlign={'right'}>
      <Text textAlign={'right'} wordBreak={'break-all'} fontSize={16} fontWeight={600} display={'inline-block'}>
        {fee || 0} BNB
      </Text>
      <Text textAlign={'right'} wordBreak={'break-all'} display={'inline-block'}>({displayUsd(fee || '0', bnbPrice)})</Text>
    </Box>
  </Flex>
);
