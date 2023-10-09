import React from 'react';
import { Flex, Box, useDisclosure, QDrawer, QDrawerBody, QListItem } from '@totejs/uikit';
import { CloseIcon, MenuIcon } from '@totejs/icons';
import { GAClick } from '@/components/common/GATracker';
import { Logo } from '../Logo';
import { MENUS } from './BaseHeader';
import NextLink from 'next/link';

export const MobileHeader = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const drawTriggerRef = React.useRef(null);
  return (
    <Flex
      as="header"
      width={'100%'}
      h={64}
      paddingX="20px"
      alignItems="center"
      justifyContent={'space-between'}
      bg={isOpen ? '#fff' : 'transparent'}
      position={'fixed'}
      zIndex={1600}
      backdropFilter={'blur(10px)'}
      boxShadow={'0px 4px 24px 0px rgba(0, 0, 0, 0.08)'}
    >
      <GAClick name="dc.main.nav.logo.click">
        <Logo href="/" />
      </GAClick>
      <Box
        display="flex"
        as="button"
        onClick={() => {
          if (isOpen) {
            onClose();
          } else {
            onOpen();
          }
        }}
        ref={drawTriggerRef}
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </Box>
      <QDrawer isOpen={isOpen} onClose={onClose} rootProps={{ top: 65 }} padding={8} w={'100%'}>
        <QDrawerBody marginTop={0}>
          {MENUS.map((item) => (
            <NextLink key={item.title} href={item.link} passHref legacyBehavior>
              <QListItem
                as="a"
                href={item.link}
                target={item.target}
                key={item.title}
                right={null}
                borderBottom={'none'}
                onClick={onClose}
              >
                {item.title}
                <item.Icon w={16} />
              </QListItem>
            </NextLink>
          ))}
        </QDrawerBody>
      </QDrawer>
    </Flex>
  );
};
