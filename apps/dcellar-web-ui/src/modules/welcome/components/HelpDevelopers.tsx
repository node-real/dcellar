import { assetPrefix } from '@/base/env';
import { LandingH2, LandingResponsiveContainer } from '..';
import { Box, Flex, Text, Image, useMediaQuery } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { GAClick } from '@/components/common/GATracker';
import { INTER_FONT } from '@/modules/wallet/constants';

const datas = [
  {
    intro: 'NFT Storage and Minting',
    link: 'https://docs.nodereal.io/docs/dcellar-as-developer-tool#nft-metadata-and-medium-storage',
    img: `${assetPrefix}/images/welcome/nft.png`,
    gaClickName: 'dc_lp.homepage.use_case.nft.click',
  },
  {
    intro: 'SP Functional Verification',
    link: 'https://docs.nodereal.io/docs/dcellar-as-developer-tool#verify-your-storage-provider-sp-with-dcellar',
    img: `${assetPrefix}/images/welcome/security.png`,
    gaClickName: 'dc_lp.homepage.use_case.sp.click',
  },
  {
    intro: 'Web Hosting',
    link: 'https://docs.nodereal.io/docs/dcellar-as-developer-tool#web-hosting',
    img: `${assetPrefix}/images/welcome/host.png`,
    gaClickName: 'dc_lp.homepage.use_case.hosting.click',
  },
];
export const HelpDevelopers = () => {
  return (
    <LandingResponsiveContainer>
      <Flex
        my={80}
        alignItems={'center'}
        flexDirection={'column'}
        sx={{
          [smMedia]: {
            my: 20,
          },
        }}
      >
        <LandingH2>How DCellar Helps Developers</LandingH2>
        <Text
          marginBottom={40}
          fontSize={16}
          fontFamily={INTER_FONT}
          textAlign={'center'}
          sx={{
            [smMedia]: {
              margin: '8px auto 20px',
            },
          }}
        >
          DCellar can be used as a powerful developer tool that can make developer life much easier.
        </Text>
        <Flex
          gap={24}
          sx={{
            [smMedia]: {
              flexDirection: 'column',
            },
          }}
        >
          {datas &&
            datas.map((item, index) => (
              <GAClick name={item.gaClickName} key={index}>
                <Box as="a" href={item.link} key={index} target="_blank">
                  <Image alt={`${item.intro} icon`} src={item.img}></Image>
                  <Text
                    as="h3"
                    py={24}
                    fontFamily={INTER_FONT}
                    textAlign={'center'}
                    fontSize={24}
                    fontWeight={600}
                    sx={{
                      [smMedia]: {
                        p: '12px 0 0 0',
                        fontSize: 16,
                      },
                    }}
                  >
                    {item.intro}
                  </Text>
                </Box>
              </GAClick>
            ))}
        </Flex>
      </Flex>
    </LandingResponsiveContainer>
  );
};
