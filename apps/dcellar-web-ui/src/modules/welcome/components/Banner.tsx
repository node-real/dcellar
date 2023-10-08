import { assetPrefix } from '@/base/env';
import { Box, Flex, Image, Text } from '@totejs/uikit';
import { ConnectWallet } from '@/components/ConnectWallet';
import { smMedia } from '@/modules/responsive';
import { LandingResponsiveContainer, lgMedia, mdMedia, xlMedia } from '..';

const MIN_WIDTH_1440 = '@media screen and (min-width: 1440px)';

export const Banner = () => {
  return (
    <LandingResponsiveContainer>
      <Flex paddingTop={104} bg={`url(${assetPrefix}/images/welcome/bg.png) no-repeat top/auto 100%`} sx={{
        [smMedia]: {
          flexDirection: 'column'
        }
      }}>
        <Flex
          flexDir="column"
          alignItems="flex-start"
          flex={1}
          justifyContent={'flex-end'}
          alignContent={'flex-end'}
          marginRight={40}
          sx={{
            [mdMedia]: {
              marginRight: 16,
            },
          }}
        >
          <Text
            as={'h1'}
            fontSize={48}
            fontWeight={700}
            sx={{
              [lgMedia]: {
                fontSize: '32px',
              },
              [mdMedia]: {
                fontSize: '24px',
              },
              [smMedia]: {
                fontSize: '24px',
              },
            }}
          >
            Storage Console for Developers on BNB Greenfield Network
          </Text>
          <Text
            as="h2"
            my={20}
            fontSize={20}
            sx={{
              [lgMedia]: {
                fontSize: '20px',
              },
              [mdMedia]: {
                fontSize: '16px',
              },
              [smMedia]: {
                fontSize: '14px',
              },
            }}
          >
            Empower developers to build with BNB Greenfield Network at ease, assist in development
            process and team collaboration.
          </Text>
          <ConnectWallet gaClickName="dc_lp.homepage.hero.get_started.click" text="Get Started" />
        </Flex>
        <Flex justifySelf={'flex-end'} alignSelf={'flex-end'}>
          <Image
            alt="dcellar function screenshot"
            src={`${assetPrefix}/images/welcome/banner.png`}
            w={553}
            sx={{
              [mdMedia]: {
                w: '440px',
              },
              [smMedia]: {
                w: '100%',
                marginTop: '24px',
              },
            }}
          />
        </Flex>
      </Flex>
    </LandingResponsiveContainer>
  );
};
