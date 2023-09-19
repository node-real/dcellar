import React from 'react';
import {
  Flex,
  Box,
  useDisclosure,
  QDrawer,
  QDrawerCloseButton,
  QDrawerBody,
  QListItem,
} from '@totejs/uikit';
import { CloseIcon, MenuIcon } from '@totejs/icons';
import { GAClick } from '@/components/common/GATracker';
import { Logo } from '../Logo';
import { MENUS } from './BaseHeader';

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
    >
      <GAClick name="dc.main.nav.logo.click">
        <Logo href="/buckets" />
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
            <QListItem
              as="a"
              href={item.link}
              target={item.target}
              key={item.title}
              right={null}
              borderBottom={'none'}
            >
              {item.title}
              <item.Icon w={16}/>
            </QListItem>
          ))}
        </QDrawerBody>
      </QDrawer>
    </Flex>
  );
};
