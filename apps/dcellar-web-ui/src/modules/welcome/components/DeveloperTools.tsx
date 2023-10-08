import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { Box, Flex, Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { GAClick } from '@/components/common/GATracker';

const datas = [
  {
    icon: '',
    iconBg: '#C372F6',
    name: 'BNB Greenfield Whitepaper',
    link: 'https://greenfield.bnbchain.org/docs',
    gaClickName: 'dc_lp.homepage.tool.whitepaper.click',
  },
  {
    icon: '',
    iconBg: '#F5A861',
    name: 'BNB Greenfield Docs',
    link: 'https://greenfield.bnbchain.org/docs',
    gaClickName: 'dc_lp.homepage.tool.docs.click',
  },
  {
    icon: '',
    iconBg: '#7983EF',
    name: 'BNB Chain Community',
    link: 'https://discord.com/invite/bnbchain',
    gaClickName: 'dc_lp.homepage.tool.discord.click',
  },
  {
    icon: '',
    iconBg: '#88E286',
    name: 'Explorer-GreenfieldScan',
    link: 'https://greenfieldscan.com/',
    gaClickName: 'dc_lp.homepage.tool.greenfieldscan.click',
  },
  {
    icon: '',
    iconBg: '#69B2F4',
    name: 'BNB Greenfield Calculator',
    link: 'https://dcellar.io/pricing-calculator',
    gaClickName: 'dc_lp.homepage.tool.pricingcalculator.click',
  },
  {
    icon: '',
    iconBg: '#000000',
    name: 'BNB Greenfield Github',
    link: 'https://github.com/bnb-chain/greenfield',
    gaClickName: 'dc_lp.homepage.tool.github.click',
  },
  {
    icon: '',
    iconBg: '#1DAC8A',
    name: 'BNB Chain Faucet',
    link: 'https://testnet.bnbchain.org/faucet-smart',
    gaClickName: 'dc_lp.homepage.tool.faucet.click',
  },
];
export const DeveloperTools = () => {
  return (
    <LandingResponsiveContainer>
      <Flex
        my={40}
        flexDirection={'column'}
        alignItems={'center'}
        gap={40}
        sx={{
          [smMedia]: {
            my: 20,
            gap: 20,
          },
        }}
      >
        <LandingH2>Developer Tools and Resources</LandingH2>
        <Flex
          gap={24}
          flexWrap={'wrap'}
          justifyContent={'center'}
          sx={{
            [smMedia]: {
              gap: 16,
              mx: 16,
            },
          }}
        >
          {datas &&
            datas.map((item, index) => (
              <GAClick key={index} name={item.gaClickName}>
                <Flex
                  as={'a'}
                  href={item.link}
                  target="_blank"
                  _hover={{
                    bgColor: 'bg.bottom',
                  }}
                  key={index}
                  p={20}
                  alignItems={'center'}
                  border={'1px solid readable.border'}
                  borderRadius={4}
                  sx={{
                    [smMedia]: {
                      width: 'calc(50% - 8px)',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      p: 12,
                    },
                  }}
                >
                  <Box
                    w={40}
                    h={40}
                    bgColor={item.iconBg}
                    sx={{
                      [smMedia]: {
                        w: 24,
                        h: 24,
                      },
                    }}
                  >
                    Ic
                  </Box>
                  <Text
                    marginLeft={16}
                    fontSize={16}
                    fontWeight={600}
                    sx={{
                      [smMedia]: {
                        marginLeft: 0,
                        marginTop: 16,
                        fontSize: 12,
                        fontWeight: 500,
                      },
                    }}
                  >
                    {item.name}
                  </Text>
                </Flex>
              </GAClick>
            ))}
        </Flex>
      </Flex>
    </LandingResponsiveContainer>
  );
};
