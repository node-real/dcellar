import { InternalRoutePaths } from '@/constants/paths';
import { Flex, Text } from '@node-real/uikit';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

export type InsufficientBalancesProps = {
  loginAccount: string;
  accounts: string[];
};

export const InsufficientBalances = ({ loginAccount, accounts }: InsufficientBalancesProps) => {
  const [activeWays, setActiveWays] = useState<{ link: string; text: string }[]>([]);

  useEffect(() => {
    const ways = accounts.map((account) => {
      const isOwnerAccount = account === loginAccount;
      return isOwnerAccount
        ? {
            link: InternalRoutePaths.transfer_in,
            text: 'Transfer in',
          }
        : {
            link: `${InternalRoutePaths.send}&from=${loginAccount}&to=${account}`,
            text: 'Send',
          };
    });
    setActiveWays(ways);
  }, [loginAccount, accounts]);

  return (
    <Flex color={'#EE3911'} flexDirection={'column'} gap={4}>
      {activeWays.map((item, index) => (
        <Flex key={index}>
          Insufficient balance.&nbsp;
          <NextLink href={item.link} passHref legacyBehavior>
            <Text
              cursor={'pointer'}
              display={'inline'}
              style={{ textDecoration: 'underline' }}
              color="#EE3911"
              _hover={{ color: '#EE3911' }}
            >
              {item.text}
            </Text>
          </NextLink>
        </Flex>
      ))}
    </Flex>
  );
};
