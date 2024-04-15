import React from 'react';
import { GAClick } from '@/components/common/GATracker';
import { Box, Flex, Text, useMediaQuery } from '@node-real/uikit';
import { WalletKitEmbeddedModal } from '@node-real/walletkit';
import { assetPrefix } from '@/base/env';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/layout/Logo';
import { ConnectWallet as ConnectWalletButton } from '@/components/ConnectWallet';
import { IconFont } from '@/components/IconFont';

const leftBg = `url(${assetPrefix}/images/connect-wallet/icon-cw-left.svg) no-repeat left 0 bottom 0`;
const rightBg = `url(${assetPrefix}/images/connect-wallet/icon-cw-right.svg) no-repeat right 0 top 10%`;
const bottomBg = `url(${assetPrefix}/images/connect-wallet/icon-cw-bottom.svg) no-repeat right 0% bottom 0%`;

export const ConnectWallet = () => {
  const [isMobile] = useMediaQuery('(max-width: 767px)');
  const bg = isMobile ? `${leftBg}, ${rightBg}` : `${leftBg}, ${rightBg}, ${bottomBg}`;
  const bodyHeight = isMobile ? 'calc(100vh - 67px)' : 'calc(100vh - 50px)';

  return (
    <>
      <Box h="100vh" w="100vw">
        <Flex
          h={64}
          alignItems="center"
          paddingLeft={isMobile ? '20px' : '40px'}
          position="fixed"
          top={0}
          left={0}
        >
          <GAClick name="dc.connect_wallet.nav.logo.click">
            <Logo href="/" />
          </GAClick>
        </Flex>
        <Flex height={bodyHeight}>
          <Box
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            background={bg}
            backgroundSize={isMobile ? '50% auto, auto' : 'auto, auto'}
            backgroundColor="#f9f9f9"
          >
            <Flex h="100%" alignItems="center" justifyContent="center" paddingX={20}>
              <Flex flexDirection="column" maxW={509} gap={24} overflow="hidden">
                <Text as="h1" fontSize={40} fontWeight={700}>
                  BNB Greenfield Storage Console
                </Text>
                <Text as="h2" fontSize={16} color="readable.secondary">
                  Empower developers to quickly get started with BNB Greenfield decentralized
                  storage and assist in the development process.
                </Text>
                {isMobile && (
                  <ConnectWalletButton
                    text="Connect Wallet"
                    w="fit-content"
                    margin="80px auto 0"
                    h={54}
                    padding="8px 16px"
                    fontWeight={600}
                    icon={<IconFont w={24} type="wallet" />}
                  />
                )}
              </Flex>
            </Flex>
          </Box>
          {!isMobile && (
            <Flex width="fit-content" paddingX={60} alignItems="center" justifyContent="center">
              <ConnectWalletButton displayType="embeddedModal" />
            </Flex>
          )}
        </Flex>
        <Footer borderTop="1px solid readable.border" />
      </Box>
    </>
  );
};
