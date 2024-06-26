import { ButtonGroup, Flex } from '@node-real/uikit';

import { runtimeEnv } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';

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
    if (net === network) return;
    window.location.href = LINKS[net].fullUrl;
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
        h={37}
      >
        <DCButton
          h={35}
          borderRadius={3}
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
          borderRadius={3}
          onClick={(e) => {
            e.preventDefault();
            onSwitchClick('testnet');
          }}
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
