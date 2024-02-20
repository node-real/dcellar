import { Flex, Text, Box } from '@node-real/uikit';
import React from 'react';
import { displayUsd } from './Calculator';
import { smMedia } from '@/modules/responsive';
import { displayTokenSymbol } from '@/utils/wallet';

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
    <Flex
      alignItems={'center'}
      flexWrap={'wrap'}
      sx={{
        [smMedia]: {
          fontSize: '12px',
        },
      }}
    >
      <Text
        fontSize={16}
        fontWeight={600}
        minW={160}
        sx={{
          [smMedia]: {
            width: '100%',
            fontSize: '12px',
          },
        }}
      >
        {title}
      </Text>
      <Text
        sx={{
          [smMedia]: {
            color: 'readable.tertiary',
          },
        }}
      >
        {size || 0} {unit}
      </Text>
      <Text
        sx={{
          [smMedia]: {
            color: 'readable.tertiary',
          },
        }}
      >
        &nbsp;X&nbsp;
      </Text>
      <Text
        whiteSpace={'nowrap'}
        sx={{
          [smMedia]: {
            color: 'readable.tertiary',
          },
        }}
      >
        {storeTime}
      </Text>
    </Flex>
    <Box textAlign={'right'}>
      <Text
        textAlign={'right'}
        wordBreak={'break-all'}
        fontSize={16}
        fontWeight={600}
        display={'inline-block'}
        sx={{
          [smMedia]: {
            fontSize: '12px',
          },
        }}
      >
        {fee || 0} {'BNB'}
      </Text>
      <Text
        textAlign={'right'}
        wordBreak={'break-all'}
        display={'inline-block'}
        sx={{
          [smMedia]: {
            fontSize: '12px',
            color: 'readable.tertiary'
          },
        }}
      >
        ({displayUsd(fee || '0', bnbPrice)})
      </Text>
    </Box>
  </Flex>
);
