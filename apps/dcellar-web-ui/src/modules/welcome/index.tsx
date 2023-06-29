import { assetPrefix } from '@/base/env';
import { Footer } from '@/components/layout/Footer';
import { usePreloadPages } from '@/modules/welcome/hooks/usePreloadPages';
import { Flex, Image, Text } from '@totejs/uikit';
import React from 'react';
import { ConnectWallet } from '@/components/ConnectWallet';

const MIN_WIDTH_1440 = '@media screen and (min-width: 1440px)';

export function Welcome() {
  usePreloadPages();

  return (
    <>
      <Flex
        alignItems="center"
        justifyContent="center"
        minH={600}
        minW={1000}
        overflow="auto"
        h="100vh"
        position="relative"
        px={110}
        bgRepeat="no-repeat"
        bgPos="calc(50% + 250px) center"
        bgImg={`url(${assetPrefix}/images/welcome_bg.svg)`}
        sx={{
          bgSize: `1727px auto`,
          [MIN_WIDTH_1440]: {
            bgSize: `2154px auto`,
          },
        }}
      >
        <Image
          src={`${assetPrefix}/images/logo_welcome.svg`}
          alt="Storage app icon"
          height={144}
          position="absolute"
          left={0}
          top={0}
        />

        <Flex flexDir="column" alignItems="flex-start" maxW={1220} fontWeight={700} w="100%">
          <Text fontSize={56} lineHeight="68px">
            Welcome to DCellar
          </Text>
          <Text mt={36} mb={48} fontSize={28} lineHeight="34px" whiteSpace="pre-wrap">
            {`Start your journey of BNB Greenfield\r\ndecentralized data network Now.🥳`}
          </Text>
          <ConnectWallet />
        </Flex>

        <Footer
          bgColor="transparent"
          color="#76808F"
          position="absolute"
          bottom={0}
          alignSelf="flex-start"
          left="50%"
          transform="translateX(-50%)"
        />
      </Flex>
    </>
  );
}
