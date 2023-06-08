import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import { Footer } from '@/components/layout/Footer';
import { useLogin } from '@/hooks/useLogin';
import { WalletConnectModal } from '@/modules/welcome/components/WalletConnectModal';
import { BG_SIZE_STYLES, WELCOME_BG } from '@/modules/welcome/constants';
import { useAppLogin } from '@/modules/welcome/hooks/useAppLogin';
import { usePreloadPages } from '@/modules/welcome/hooks/usePreloadPages';
import { Image, Flex, Text, useDisclosure } from '@totejs/uikit';
import React, { useCallback, useState } from 'react';

export function Welcome() {
  usePreloadPages();

  const { isOpen, onClose, onOpen } = useDisclosure();

  const { loginState } = useLogin();
  const [currentAddress, setCurrentAddress] = useState<string | undefined>(loginState.address);

  const { isAuthPending } = useAppLogin(currentAddress);

  const onSuccess = useCallback(
    (address?: string) => {
      setCurrentAddress(address);
      onClose();
    },
    [onClose],
  );

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
        bgImg={`url(${WELCOME_BG})`}
        sx={BG_SIZE_STYLES}
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

      <WalletConnectModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />
    </>
  );
}
