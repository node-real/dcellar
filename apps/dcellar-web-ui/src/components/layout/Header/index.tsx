import { Box, Button, Circle, Flex, Image, Link, Text, useOutsideClick } from '@totejs/uikit';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { PulseIcon, ReverseHIcon, SaverIcon } from '@totejs/icons';

import { NewBalance } from '@/components/layout/Header/NewBalance';
import { getShortenWalletAddress } from '@/utils/wallet';
import { assetPrefix } from '@/base/env';
import { InternalRoutePaths } from '@/constants/paths';
import { CopyText } from '@/components/common/CopyText';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { Tips } from '@/components/common/Tips';
import { Logo } from '@/components/layout/Logo';
import { StreamBalance } from '@/components/layout/Header/StreamBalance';
import { useDebounceEffect } from 'ahooks';
import { setupBnbPrice } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';
import { useLogin } from '@/hooks/useLogin';

const renderAvatar = (size?: 'sm' | 'md') => {
  const circleSize = size === 'sm' ? 32 : 36;
  const imgSize = size === 'sm' ? 28 : 32;
  return (
    <Circle size={circleSize} borderRadius="50%" border="1px solid readable.border">
      <Image alt="avatar" boxSize={imgSize} src={`${assetPrefix}/images/icons/avatar.svg`} />
    </Circle>
  );
};

export const Header = () => {
  const dispatch = useAppDispatch();
  const { logout } = useLogin();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const router = useRouter();
  const shortAddress = getShortenWalletAddress(address);

  const [showPanel, setShowPanel] = useState(false);
  const ref = useRef(null);

  useOutsideClick({
    ref,
    handler: () => {
      if (showPanel) {
        setTimeout(() => {
          setShowPanel(false);
        }, 50);
      }
    },
  });

  useDebounceEffect(() => {
    if (!showPanel) return;
    dispatch(setupBnbPrice());
  }, [showPanel]);

  return (
    <>
      <StreamBalance />
      <Flex
        w="340px"
        ref={ref}
        visibility={showPanel ? 'visible' : 'hidden'}
        bg="readable.white"
        borderRadius="12px"
        position="fixed"
        zIndex="popover"
        right="24px"
        flexDirection="column"
        top="70px"
        padding="16px"
        boxShadow="0px 4px 20px rgba(0, 0, 0, 0.04);"
      >
        <Flex alignItems="center" h="36px">
          {renderAvatar('sm')}
          <CopyText
            value={address}
            iconProps={{ color: 'readable.normal' }}
            gaClickName="dc.main.account.copy_add.click"
          >
            <Text fontWeight="500" fontSize="16px" marginX="6px">
              {shortAddress}
            </Text>
          </CopyText>
        </Flex>
        <Flex alignItems="center" mt="16px">
          <Text color="readable.disabled" fontWeight="400" fontSize="12px" lineHeight="20px">
            Available Balance
          </Text>
          <Tips
            iconSize={'16px'}
            containerWidth={'200px'}
            tips={
              <Box fontSize={'12px'} lineHeight="14px" width={'200px'}>
                <Box>
                  Please notice that due to the locked fee, Greenfield available balance is not
                  equal to your account overall balance, which is shown at your wallet.
                </Box>
                <Link
                  href="https://docs.nodereal.io/docs/faq-1#question-what-is-greenfield-available-balance"
                  target="_blank"
                  color="readable.primary"
                  textDecoration="underline"
                  _hover={{ color: 'readable.brand5' }}
                >
                  Learn more
                </Link>
              </Box>
            }
          />
        </Flex>
        <NewBalance />
        <Flex alignItems="center" mt="16px" width="100%" justifyContent="space-between" h="24px">
          <GAClick name="dc.main.account.transferin.click">
            <Button
              variant="scene"
              bgColor="#00BA34"
              _hover={{ bg: '#2EC659' }}
              w={'93px'}
              h="24px"
              borderRadius="4px"
              padding={0}
              iconSpacing={0}
              leftIcon={<PulseIcon size="sm" />}
              fontWeight="400"
              fontSize="12px"
              onClick={() => {
                router.push(InternalRoutePaths.transfer_in);
              }}
            >
              Transfer In
            </Button>
          </GAClick>
          <GAClick name="dc.main.account.transferout.click">
            <Button
              variant="scene"
              bgColor="readable.normal"
              h="24px"
              _hover={{ bg: 'readable.secondary' }}
              borderRadius="4px"
              w={'104px'}
              padding={0}
              iconSpacing={0}
              onClick={() => {
                router.push(InternalRoutePaths.transfer_out);
              }}
              leftIcon={<SaverIcon size="sm" />}
              fontWeight="400"
              fontSize="12px"
            >
              Transfer Out
            </Button>
          </GAClick>
          <GAClick name="dc.main.account.send.click">
            <Button
              variant="scene"
              bgColor="readable.normal"
              h="24px"
              w={'91px'}
              padding={0}
              borderRadius="4px"
              iconSpacing={0}
              _hover={{ bg: 'readable.secondary' }}
              onClick={() => {
                router.push(InternalRoutePaths.send);
              }}
              leftIcon={<ReverseHIcon size="sm" />}
              fontWeight="400"
              fontSize="12px"
            >
              Send
            </Button>
          </GAClick>
        </Flex>
        <Flex h="1px" marginTop="20px" marginBottom="8px" w="100%" bg="readable.border" />
        <GAClick name="dc.main.account.disconnect.click">
          <Flex
            h="56px"
            alignItems="center"
            onClick={logout}
            paddingX="16px"
            cursor="pointer"
            borderRadius="8px"
            _hover={{ bg: 'bg.bottom' }}
          >
            <Image
              src={`${assetPrefix}/images/login_panel_icons/logout.svg`}
              w="24px"
              mr="8px"
              alt=""
            />
            <Text color="readable.normal" fontWeight={500} fontSize="16px">
              Disconnect
            </Text>
          </Flex>
        </GAClick>
      </Flex>

      <Flex
        position="fixed"
        top={0}
        left={0}
        right={0}
        paddingY={'10px'}
        pr={'24px'}
        bg="bg.middle"
        borderBottom="1px solid #E6E8EA"
        justifyContent={'right'}
      >
        <Flex paddingLeft="24px" alignItems={'center'}>
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
        <Flex flex={1} />
        <GAShow isShow={showPanel} name="dc.main.account.popup.show" />
        <GAClick name="dc.main.header.account.click">
          <Flex
            alignItems="center"
            justifyContent="center"
            h="44px"
            borderRadius="22px"
            border="1px solid #E6E8EA"
            paddingLeft="4px"
            paddingRight="12px"
            cursor="pointer"
            transitionProperty="colors"
            transitionDuration="normal"
            bg={showPanel ? 'bg.bottom' : 'inherit'}
            _hover={{
              bg: 'bg.bottom',
            }}
            onClick={() => {
              setShowPanel(true);
            }}
          >
            {renderAvatar('md')}
            <Text ml="8px" fontWeight="500" fontSize="14px">
              {shortAddress}
            </Text>
          </Flex>
        </GAClick>
      </Flex>
    </>
  );
};
