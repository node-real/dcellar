import { Box, Text } from '@node-real/uikit';
import { Card } from './Common';
import { assetPrefix } from '@/base/env';
import { DCButton } from '@/components/common/DCButton';

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
        Tell us what other tools you want.
      </Text>
      <Box textAlign={'center'}>
        <Text color={'readable.secondary'}>
          Want some off-the-shelf tools, API, or SDK to aid in development? Feel free to give us a
          message.
        </Text>
      </Box>
      <DCButton
        margin={'16px auto 0'}
        variant="brand"
        w={'fit-content'}
        onClick={() => onNavigateExternal('https://discord.com/invite/bnbchain/')}
      >
        Contact Us
      </DCButton>
    </Card>
  );
};
