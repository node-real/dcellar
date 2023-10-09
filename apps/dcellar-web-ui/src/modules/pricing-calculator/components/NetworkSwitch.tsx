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
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = LINKS[net].fullUrl;
    a.click();
  };
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
          border="none"
          h={35}
          onClick={() => onSwitchClick('testnet')}
          sx={
            network === 'testnet'
              ? {}
              : {
                  bgColor: 'bg.bottom',
                  color: 'readable.normal',
                  _hover: {
                    bgColor: 'bg.secondary',
                  },
                }
          }
        >
          Testnet
        </DCButton>
      </ButtonGroup>
    </Flex>
  );
};
