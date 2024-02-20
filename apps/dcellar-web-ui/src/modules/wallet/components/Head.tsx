import { Text } from '@node-real/uikit';
import { memo } from 'react';
import { useAppSelector } from '@/store';

const HeadContent = {
  transfer_in: {
    title: 'transfer in',
    subtitle: (
      <>
        Transfer BNB from BNB Smart Chain to your BNB Greenfield account.
      </>
    ),
  },
  transfer_out: {
    title: 'transfer out',
    subtitle: 'Transfer BNB out of your BNB Greenfield account to BNB Smart Chain.',
  },
  send: {
    title: 'send',
    subtitle: 'Send/deposit/withdraw between BNB Greenfield accounts.',
  },
};

interface HeadProps {}

export const Head = memo<HeadProps>(function Head() {
  const { transType } = useAppSelector((root) => root.wallet);
  const content = HeadContent[transType];
  return (
    <>
      <Text
        fontWeight={'600'}
        fontSize="24px"
        textAlign="center"
        mb={'12px'}
        w={'100%'}
        textTransform="capitalize"
      >
        {content?.title}
      </Text>
      <Text fontSize={'14px'} w={'100%'} textAlign="center" mb={'24px'} color={'readable.tertiary'}>
        {content?.subtitle}
      </Text>
    </>
  );
});
