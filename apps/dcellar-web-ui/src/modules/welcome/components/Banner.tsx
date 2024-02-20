import { assetPrefix } from '@/base/env';
import { Box, Flex, Image, Text } from '@node-real/uikit';
import { ConnectWallet } from '@/components/ConnectWallet';
import { smMedia } from '@/modules/responsive';
import { LandingResponsiveContainer, lgMedia, mdMedia } from '..';
import { INTER_FONT } from '@/modules/wallet/constants';

export const Banner = () => {
  return (
    <Box bg={`url(${assetPrefix}/images/welcome/bg.png) no-repeat top/auto 100%`}>
      <LandingResponsiveContainer>
        <Flex
          paddingTop={144}
          sx={{
            [smMedia]: {
              flexDirection: 'column',
              pt: 104,
            },
          }}
        >
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
              fontFamily={INTER_FONT}
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
              <Box>Storage Console for</Box>
              <Box>Developers on</Box>
              <Box position={'relative'} whiteSpace={'nowrap'}>
                BNB Greenfield Network
              </Box>
            </Text>
            <Text
              as="h2"
              my={20}
              fontSize={20}
              fontWeight={400}
              fontFamily={INTER_FONT}
              color={'readable.secondary'}
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
            <ConnectWallet
              gaClickName="dc_lp.homepage.hero.get_started.click"
              text="Get Started"
              marginBottom={40}
            />
          </Flex>
          <Flex justifySelf={'flex-end'} alignSelf={'flex-end'}>
            <Image
              alt="dcellar function screenshot"
              src={`${assetPrefix}/images/welcome/banner_3_new.png`}
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
    </Box>
  );
};
