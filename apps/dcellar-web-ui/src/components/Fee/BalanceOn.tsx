import React from 'react';
import { Text, TextProps } from '@node-real/uikit';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { renderFee } from '@/utils/common';

type BalanceOnProps = TextProps & {
  amount: string;
};
export const BalanceOn = ({ amount, ...restProps }: BalanceOnProps) => {
  const bnbPrice = useAppSelector(selectBnbPrice);

  return (
    <Text color={'readable.tertiary'} fontSize={12} textAlign={'right'} mt={8} {...restProps}>
      Balance on Greenfield: {renderFee(amount, bnbPrice)}
    </Text>
  );
};
