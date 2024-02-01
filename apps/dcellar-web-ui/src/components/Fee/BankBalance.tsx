import React from 'react';
import { Flex, TextProps } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { renderFee } from '@/utils/common';
import { LearnMoreTips } from '../common/Tips';

type BankBalanceProps = TextProps & {
  amount: string;
};

const TipsLink = 'https://docs.nodereal.io/docs/dcellar-faq#question-what-is-bank-balance';
const TipsText = 'Bank Balance';

export const BankBalance = ({ amount, ...restProps }: BankBalanceProps) => {
  const bnbPrice = useAppSelector(selectBnbPrice);

  return (
    <Flex
      color={'readable.disable'}
      fontSize={12}
      textAlign={'right'}
      {...restProps}
      justifyContent={'flex-end'}
    >
      Owner Account Bank Balance <LearnMoreTips href={TipsLink} text={TipsText} />:{' '}
      {renderFee(amount, bnbPrice)}
    </Flex>
  );
};
