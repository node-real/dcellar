import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { Flex, Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { GAClick } from '@/components/common/GATracker';
import { IconFont, IconFontProps } from '@/components/IconFont';

const ResponsiveIcon = ({ type, ...restProps }: IconFontProps) => {
  return (
    <IconFont
      type={type}
      w={32}
      sx={{
        [smMedia]: {
          w: 16,
        },
      }}
      {...restProps}
    />
  );
};
const datas = [
  {
    icon: <ResponsiveIcon type="w-search" color={'readable.white'}/>,
    iconBg: '#C372F6',
    name: 'BNB Greenfield Whitepaper',
    link: 'https://greenfield.bnbchain.org/docs',
    gaClickName: 'dc_lp.homepage.tool.whitepaper.click',
  },
  {
    icon: <ResponsiveIcon type="w-docs" color={'readable.white'}/>,
    iconBg: '#F5A861',
    name: 'BNB Greenfield Docs',
    link: 'https://greenfield.bnbchain.org/docs',
    gaClickName: 'dc_lp.homepage.tool.docs.click',
  },
  {
    icon: <ResponsiveIcon type="w-discord" color={'readable.white'}/>,
    iconBg: '#7983EF',
    name: 'BNB Chain Community',
    link: 'https://discord.com/invite/bnbchain',
    gaClickName: 'dc_lp.homepage.tool.discord.click',
  },
  {
    icon: <ResponsiveIcon type="w-explorer"/>,
    iconBg: '#88E286',
    name: 'Explorer-GreenfieldScan',
    link: 'https://greenfieldscan.com/',
    gaClickName: 'dc_lp.homepage.tool.greenfieldscan.click',
  },
  {
    icon: <ResponsiveIcon type="w-calculator" color={'readable.white'}/>,
    iconBg: '#69B2F4',
    name: 'BNB Greenfield Calculator',
    link: 'https://dcellar.io/pricing-calculator',
    gaClickName: 'dc_lp.homepage.tool.pricingcalculator.click',
  },
  {
    icon: <ResponsiveIcon type="w-github" w={36}/>,
    iconBg: '#000000',
    name: 'BNB Greenfield Github',
    link: 'https://github.com/bnb-chain/greenfield',
    gaClickName: 'dc_lp.homepage.tool.github.click',
  },
  {
    icon: <ResponsiveIcon type="w-faucet" color={'readable.white'}/>,
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
                  <Flex
                    w={40}
                    h={40}
                    bgColor={item.iconBg}
                    justifyContent={'center'}
                    alignItems={'center'}
                    borderRadius={4}
                    sx={{
                      [smMedia]: {
                        w: 24,
                        h: 24,
                      },
                    }}
                  >
                    {item.icon}
                  </Flex>
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
