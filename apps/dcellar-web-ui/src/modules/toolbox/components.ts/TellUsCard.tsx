import React from 'react';
import { Card } from './common';
import { Box, Text } from '@totejs/uikit';
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
    >
      <Text fontSize={18} fontWeight={600} color={'readable.normal'} textAlign={'center'}>
        Tell us what other tools you want.
      </Text>
      <Box textAlign={'center'}>
        <Text color={'readable.secondary'}>
          Want some off-the-shelf widgets to aid in development?
        </Text>
        <Text color={'readable.secondary'}>Feel free to give us a message.</Text>
      </Box>
      {/* TODO Fill link url*/}
      <DCButton
        margin={'16px auto 0'}
        variant="brand"
        w={'fit-content'}
        onClick={() => onNavigateExternal('#')}
      >
        Contact Us
      </DCButton>
    </Card>
  );
};
