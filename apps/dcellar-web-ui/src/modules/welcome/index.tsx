import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import { Footer } from '@/components/layout/Footer';
import { MEDIA_QUERY } from '@/constants/common';
import { WalletConnectModal } from '@/modules/welcome/components/WalletConnectModal';
import { useAppLogin } from '@/modules/welcome/hooks/useAppLogin';
import { usePreloadPages } from '@/modules/welcome/hooks/usePreloadPages';
import { Image, Flex, Text, useDisclosure } from '@totejs/uikit';
import React from 'react';

export function Welcome() {
  usePreloadPages();

  const { isOpen, onClose, onOpen } = useDisclosure();
  const { isAuthPending } = useAppLogin();

  return (
    <>
      <Flex
        flexDir="column"
        justifyContent="space-between"
        alignItems="center"
        minH={600}
        minW={1000}
        overflow="auto"
        pl={110}
        h="100vh"
        sx={{
          bg: `url(${assetPrefix}/images/welcome_bg_gradient.svg) no-repeat right center/cover, url(${assetPrefix}/images/welcome_bg_1.svg) no-repeat left 248px top 100px/972px`,
          [MEDIA_QUERY.MIN_WIDTH_1440]: {
            bg: `url(${assetPrefix}/images/welcome_bg_gradient.svg) no-repeat right center/cover, url(${assetPrefix}/images/welcome_bg_1.svg) no-repeat left 80% top 100px /1215px`,
          },
          [MEDIA_QUERY.WIDTH_BETWEEN_1000_AND_1440]: {
            bg: `url(${assetPrefix}/images/welcome_bg_gradient.svg) no-repeat right center/cover, url(${assetPrefix}/images/welcome_bg_1.svg) no-repeat left 248px top 100px/1215px`,
          },
        }}
      >
        <Image
          src={`${assetPrefix}/images/logo_welcome.svg`}
          alt="Storage app icon"
          height={144}
          position="absolute"
          left={0}
        />

        <Flex
          flexDir="column"
          alignItems="flex-start"
          flex={1}
          maxW={1200}
          fontWeight={700}
          w="100%"
          sx={{
            mt: 204,
            [MEDIA_QUERY.MIN_HEIGHT_800]: {
              mt: 246,
            },
          }}
        >
          <Text fontSize={56} lineHeight="68px">
            Welcome to DCellar
          </Text>
          <Text mt={36} mb={48} fontSize={28} lineHeight="34px" whiteSpace="pre-wrap">
            {`Start your journey of BNB Greenfield\r\ndecentralized data network Now.🥳`}
          </Text>
          <DCButton
            variant="dcPrimary"
            px={48}
            h={54}
            fontSize={18}
            lineHeight="22px"
            fontWeight={600}
            onClick={onOpen}
            isLoading={isAuthPending}
          >
            Connect Wallet
          </DCButton>
        </Flex>

        <Footer bgColor="transparent" color="#76808F" />
      </Flex>

      <WalletConnectModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
