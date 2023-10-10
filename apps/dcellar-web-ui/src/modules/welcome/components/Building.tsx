import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { Box, Flex, Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { IconFont } from '@/components/IconFont';
import { INTER_FONT } from '@/modules/wallet/constants';

const datas = [
  {
    icon: (
      <IconFont
        type="w-list"
        w={32}
        sx={{
          [smMedia]: {
            w: 16,
          },
        }}
      />
    ),
    title: 'Decentralized Storage of Data',
    desc: 'BNB Greenfield allows Ethereum-compatible addresses to create and manage both data and token assets.',
  },
  {
    icon: (
      <IconFont
        type="w-eco"
        w={32}
        sx={{
          [smMedia]: {
            w: 16,
          },
        }}
      />
    ),
    title: 'Native Smart-Contract Ecosystem',
    desc: 'BNB Greenfield natively links data permissions and management logic onto BSC as exchangeable assets and smart contract programs with all other assets.',
  },
  {
    icon: (
      <IconFont
        type="w-user"
        w={32}
        sx={{
          [smMedia]: {
            w: 16,
          },
        }}
      />
    ),
    title: 'Great User Experience',
    desc: 'BNB Greenfield provides developers with similar API primitives and performance as popular existing Web2 cloud storage.',
  },
];
export const Building = () => {
  return (
    <LandingResponsiveContainer>
      <Flex
        display={'flex'}
        my={80}
        sx={{
          [smMedia]: {
            flexDirection: 'column',
            my: 20,
          },
        }}
      >
        <Flex
          flexDirection={'column'}
          marginRight={40}
          sx={{
            [smMedia]: {
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: 32,
            },
          }}
        >
          <LandingH2>Building on BNB Greenfield</LandingH2>
          <Text fontFamily={INTER_FONT} color='readable.secondary'>
            BNB Greenfield is an innovative blockchain and storage platform that seeks to unleash
            the power of decentralized technology on data ownership and the data economy.
          </Text>
        </Flex>
        <Flex
          gap={48}
          flexDirection={'column'}
          sx={{
            [smMedia]: {
              gap: 32,
            },
          }}
        >
          {datas &&
            datas.map((item, index) => (
              <Flex key={index} gap={16}>
                <Box>
                  <Flex
                    alignItems={'center'}
                    justifyContent={'center'}
                    bg="rgba(0, 186, 52, 0.10)"
                    w={56}
                    h={56}
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
                </Box>
                <Flex gap={12} flexDirection={'column'} sx={{
                  [smMedia]: {
                    gap: 8
                  }
                }}>
                  <Text fontFamily={INTER_FONT} as="h3" fontSize={20} fontWeight={700} sx={{
                    [smMedia]: {
                      fontSize: 16
                    }
                  }}>
                    {item.title}
                  </Text>
                  <Text
                    fontFamily={INTER_FONT}
                    fontSize={16}
                    color="readable.tertiary"
                    sx={{
                      [smMedia]: {
                        fontSize: 12,
                      },
                    }}
                  >
                    {item.desc}
                  </Text>
                </Flex>
              </Flex>
            ))}
        </Flex>
      </Flex>
    </LandingResponsiveContainer>
  );
};
