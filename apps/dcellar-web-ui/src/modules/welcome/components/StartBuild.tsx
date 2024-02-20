import { StartBuildContent } from '@/modules/pricing-calculator/components/StartBuild';
import { LandingResponsiveContainer, smMedia } from '..';
import { assetPrefix } from '@/base/env';
import { Flex } from '@node-real/uikit';

export const StartBuild = () => (
  <LandingResponsiveContainer>
    <Flex
      borderRadius={8}
      p={['16px', '64px 48px']}
      gap={24}
      flexDirection={'column'}
      bg={`url(${assetPrefix}/images/price/start-bg-lt-2.png) no-repeat left/auto 100%, url(${assetPrefix}/images/price/start-bg-rt.png) no-repeat right 20% top 0, url(${assetPrefix}/images/price/start-bg-rb.png) no-repeat right 0% bottom 0%`}
      bgColor={'#F9F9F9'}
      my={80}
      textAlign={'center'}
      sx={{
        [smMedia]: {
          padding: '16px',
          mt: 20,
          mb: 40,
          bg: `url(${assetPrefix}/images/price/start-bg-lt-2.png) no-repeat left/auto 100%`
        },
      }}
    >
      <StartBuildContent gaClickName='dc_lp.homepage.start.get_started.click' />
    </Flex>
  </LandingResponsiveContainer>
);
