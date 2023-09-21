import React, { useState } from 'react';
import { Box, Text, Button, Flex, useMediaQuery } from '@totejs/uikit';
import { ConfirmModal } from './component/ConfirmModal';
import { DCButton } from '../common/DCButton';
// import { reportEvent } from '@node-real/next';

export type TCookieType = 'ga' | 'st' | 'ga_st';
export type TCookieOperate = 'deny_all' | 'accept_all' | 'optional' | 'close';
type Props = {
  onClose: (type: TCookieType, operate: TCookieOperate) => void;
};
export const CookiePolicy = ({ onClose }: Props) => {
  const [open, setOpen] = useState(false);
  const [isMobile] = useMediaQuery('(max-width: 767px)');
  const onConfirmClick = (type: TCookieType, operate: TCookieOperate) => {
    onClose(type, operate);
    setOpen(false);
  };
  return (
    <Flex
      sx={{
        position: 'fixed',
        zIndex: 9,
        left: 0,
        right: 0,
        wordWrap: 'normal',
        margin: '0 auto',
        bottom: '16px',
        width: 'calc(100% - 16px)',
        borderRadius: '8px',
        maxWidth: `${isMobile ? '100%' : '590px'}`,
        background: 'rgba(20, 21, 26, 0.8)',
        backdropFilter: 'blur(6px)',
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
      }}
      justify="center"
      paddingY={'16px'}
      color="#9B00FB"
    >
      <Flex
        width={'100%'}
        maxW={'1168px'}
        justify="space-between"
        paddingX={'16px'}
        flexDirection={['column', 'row']}
      >
        <Box mb={['16px', '0']}>
          <Text maxW={'716px'} fontSize="14" lineHeight={'150%'} color="#E6E8EA">
            NodeReal uses cookies to provide a better experience. Check here to manage{' '}
            <Box
              as="button"
              color="readable.brand6"
              onClick={() => {
                setOpen(true);
                // reportEvent({
                //   name: 'nr.main.cookie.setting.click',
                //   data: {},
                // });
              }}
            >
              cookies setting
            </Box>{' '}
            or{' '}
            <Box
              as="a"
              target="_blank"
              // onClick={() => reportEvent({ name: 'nr.main.cookie.learnmore.click', data: {} })}
              href={'https://docs.nodereal.io/docs/cookie-policy'}
              color="readable.brand6"
            >
              learn more
            </Box>
            .
          </Text>
        </Box>
        <Flex align={'center'} justify={'center'}>
          <DCButton
            variant='dcPrimary'
            h={40}
            onClick={() => {
              onClose('ga_st', 'accept_all');
              // reportEvent({ name: 'nr.main.cookie.accept.click', data: {} });
            }}
            size="md"
          >
            Accept
          </DCButton>
        </Flex>
      </Flex>
      <ConfirmModal
        open={open}
        cancelFn={() => setOpen(false)}
        confirmFn={(type: TCookieType, operate: TCookieOperate) => {
          onConfirmClick(type, operate);
        }}
      />
    </Flex>
  );
};
