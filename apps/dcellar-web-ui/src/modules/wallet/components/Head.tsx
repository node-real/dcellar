import { Text } from '@totejs/uikit';
import React from 'react';
import { POPPINS_FONT } from '../constants';
import { useAppSelector } from '@/store';

const HeadContent = {
  transfer_in: {
    title: 'transfer in',
    subtitle: 'Transfer BNB from BNB Smart Chain to your BNB Greenfield account.',
  },
  transfer_out: {
    title: 'transfer out',
    subtitle: 'Transfer BNB out of your BNB Greenfield account to BNB Smart Chain.',
  },
  send: {
    title: 'send',
    subtitle: 'Send BNB to another BNB Greenfield account.',
  },
};

export const Head = () => {
  const { transType } = useAppSelector((root) => root.wallet);
  const content = HeadContent[transType];
  return (
    <>
      <Text
        fontWeight={'600'}
        fontSize="24px"
        lineHeight={'32px'}
        textAlign="center"
        mb={'8px'}
        w={'100%'}
        textTransform="capitalize"
        fontFamily={POPPINS_FONT}
      >
        {content?.title}
      </Text>
      <Text
        fontSize={'14px'}
        lineHeight="150%"
        w={'100%'}
        textAlign="center"
        mb={'16px'}
        color="#76808F"
      >
        {content?.subtitle}
      </Text>
    </>
  );
};
