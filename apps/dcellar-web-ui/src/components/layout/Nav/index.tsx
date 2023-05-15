import { Box, Flex, Text } from '@totejs/uikit';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import BucketsIcon from '@/public/images/icons/buckets.svg';
import WalletIcon from '@/public/images/icons/wallet.svg';
import WalletFilledIcon from '@/public/images/icons/wallet-filled.svg';
import BucketsFilledIcon from '@/public/images/icons/buckets-filled.svg';
import { Logo } from '../Logo';
import { isActiveUrl } from '@/utils/isActiveUrl';
import { GAClick } from '@/components/common/GATracker';

const MENU_LIST = [
  {
    icon: () => <BucketsIcon color="readable.normal" />,
    selectedIcon: () => <BucketsFilledIcon color={'#00BA34'} />,
    text: 'Buckets',
    link: '/buckets',
    enablePrefix: true,
    gaClickName: 'dc.main.nav.bucket.click',
  },
  {
    icon: () => <WalletIcon color="readable.normal" />,
    selectedIcon: () => <WalletFilledIcon color="#00BA34" />,
    text: 'Wallet',
    link: `/wallet`,
    gaClickName: 'dc.main.nav.wallet.click',
  },
];

export const Nav = () => {
  const router = useRouter();
  const [isHover, setIsHover] = useState(false);

  const over = () => {
    setIsHover(true);
  };
  const out = () => {
    setIsHover(false);
  };

  return (
    <Box
      w="269px"
      borderRight={'1px solid #E6E8EA;'}
      backgroundColor="bg.middle"
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      zIndex={1}
    >
      <Flex height={'64px'} paddingLeft="24px" alignItems={'center'}>
        <GAClick name="dc.main.nav.logo.click">
          <Logo href="/" />
        </GAClick>
        <Box
          fontSize={'12px'}
          lineHeight="24px"
          paddingX={'4px'}
          borderRadius="4px"
          bgColor={'rgba(0, 186, 52, 0.1)'}
          color="readable.brand6"
          marginLeft={'4px'}
        >
          Testnet
        </Box>
      </Flex>
      <Box p={'24px'}>
        {MENU_LIST &&
          MENU_LIST.map((item) => (
            <GAClick key={item.text} name={item.gaClickName}>
              <Link href={item.link}>
                <Flex
                  cursor={'pointer'}
                  p={'8px 12px'}
                  alignItems="center"
                  borderRadius={'8px'}
                  mb="16px"
                  onMouseOver={over}
                  onMouseOut={out}
                  backgroundColor={
                    isActiveUrl(router.pathname, item.link, router.basePath, item.enablePrefix)
                      ? 'rgba(0, 186, 52, 0.1)'
                      : 'none'
                  }
                  color={
                    isActiveUrl(router.pathname, item.link, router.basePath, item.enablePrefix)
                      ? '#009E2C'
                      : '#1E2026'
                  }
                  _hover={
                    isActiveUrl(router.pathname, item.link, router.basePath, item.enablePrefix)
                      ? {
                          backgroundColor: 'rgba(0, 186, 52, 0.15)',
                          color: '#009E2C',
                        }
                      : {
                          backgroundColor: '#F5F5F5',
                          color: '#1E2026',
                        }
                  }
                >
                  {isActiveUrl(router.pathname, item.link, router.basePath, item.enablePrefix) ? (
                    <item.selectedIcon />
                  ) : (
                    <item.icon />
                  )}
                  <Text fontWeight={500} ml={'12px'}>
                    {item.text}
                  </Text>
                </Flex>
              </Link>
            </GAClick>
          ))}
      </Box>
    </Box>
  );
};
