import React from 'react';
import { Card } from './Common';
import { Box, Text, Tooltip } from '@totejs/uikit';
import { DCButton } from '@/components/common/DCButton';
import { assetPrefix } from '@/base/env';

export const TellUsCard = () => {
  const onNavigateExternal = (url: string) => {
    window.open(url, '_blank', 'noreferrer');
  };
  return (
    <Card
      _hover={{}}
      position={'relative'}
      overflow={'hidden'}
      border={'none'}
      background={`url(${assetPrefix}/images/toolbox/icon-toolbox-bg-1.svg) no-repeat left 0 top 0, url(${assetPrefix}/images/toolbox/icon-toolbox-bg-2.svg) no-repeat right 0 top 10%, url(${assetPrefix}/images/toolbox/icon-toolbox-bg-3.svg) no-repeat left 10% bottom 0%`}
      bgColor={'#f9f9f9'}
      justifyContent={'center'}
    >
      <Text fontSize={18} fontWeight={600} color={'readable.normal'} textAlign={'center'}>
        Start Building with DCellar Now
      </Text>
      <Box textAlign={'center'}>
        <Text color={'readable.secondary'}>
          DCellar offers a full set of open source toolkits for developers to start build on
          Greenfield at ease.
        </Text>
      </Box>
      <Tooltip content="Upcoming">
        <DCButton
          margin={'16px auto 0'}
          variant="brand"
          w={'fit-content'}
          onClick={() => onNavigateExternal('#')}
        >
          Explorer
        </DCButton>
      </Tooltip>
    </Card>
  );
};
