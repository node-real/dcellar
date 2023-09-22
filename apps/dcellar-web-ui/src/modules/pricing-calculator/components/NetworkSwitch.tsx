import { runtimeEnv } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';
import { ButtonGroup, Flex } from '@totejs/uikit';
import React from 'react';

const LINKS = {
  mainnet: {
    fullUrl: 'https://dcellar.io/pricing-calculator',
    internalUrl: '/pricing-calculator',
  },
  testnet: {
    fullUrl: 'https://testnet.dcellar.io/pricing-calculator',
    internalUrl: '/pricing-calculator',
  },
};
export const NetworkSwitch = () => {
  const network = ['testnet', 'mainnet'].includes(runtimeEnv) ? runtimeEnv : 'testnet';
  const onSwitchClick = (net: 'mainnet' | 'testnet') => {
    if (net === network) {
      return;
    }
    window.open(LINKS[net].fullUrl, '_blank')
  }
  return (
    <Flex>
      <ButtonGroup
        size="md"
        variant="scene"
        colorScheme="warning"
        isAttached
        border={'1px solid readable.border'}
        borderRadius={4}
        h={35}
      >
        <DCButton
          variant="dcPrimary"
          borderRadius={4}
          h={35}
          onClick={() => onSwitchClick('mainnet')}
          sx={
            network === 'mainnet'
              ? {}
              : {
                  bgColor: 'bg.bottom',
                  color: 'readable.normal',
                  _hover: {},
                }
          }
        >
          Mainnet
        </DCButton>
        <DCButton
          variant="dcPrimary"
          border="none"
          borderRadius={4}
          h={35}
          onClick={() => onSwitchClick('testnet')}
          sx={
            network === 'testnet'
              ? {}
              : {
                  bgColor: 'bg.bottom',
                  color: 'readable.normal',
                  _hover: {},
                }
          }
        >
          Testnet
        </DCButton>
      </ButtonGroup>
    </Flex>
  );
};
