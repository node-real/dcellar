import React from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import { Box, Flex, Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';

const datas = [
  {
    icon: '',
    title: 'Decentralized Storage of Data',
    desc: 'BNB Greenfield allows Ethereum-compatible addresses to create and manage both data and token assets.',
  },
  {
    icon: '',
    title: 'Native Smart-Contract Ecosystem',
    desc: 'BNB Greenfield natively links data permissions and management logic onto BSC as exchangeable assets and smart contract programs with all other assets.',
  },
  {
    icon: '',
    title: 'Great User Experience',
    desc: 'BNB Greenfield provides developers with similar API primitives and performance as popular existing Web2 cloud storage.',
  },
];
export const Building = () => {
  return (
    <LandingResponsiveContainer>
      <Flex
        display={'flex'}
        my={40}
        sx={{
          [smMedia]: {
            flexDirection: 'column',
            my: 20,
          },
        }}
      >
        <Flex flexDirection={'column'} sx={{
          [smMedia]: {
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 32,
          }
        }}>
          <LandingH2>Building on BNB Greenfield</LandingH2>
          <Text>
            BNB Greenfield is an innovative blockchain and storage platform that seeks to unleash
            the power of decentralized technology on data ownership and the data economy.
          </Text>
        </Flex>
        <Flex gap={48} flexDirection={'column'} sx={{
          [smMedia]: {
            gap: 32
          }
        }}>
          {datas &&
            datas.map((item, index) => (
              <Flex key={index} gap={16}>
                <Box>
                  <Box bg="rgba(0, 186, 52, 0.10)" w={56} h={56} borderRadius={4} sx={{
                    [smMedia]: {
                      w: 32,
                      h: 32
                    }
                  }}></Box>
                </Box>
                <Flex gap={12} flexDirection={'column'}>
                  <Text as='h3' fontSize={20} fontWeight={700}>
                    {item.title}
                  </Text>
                  <Text fontSize={16}>{item.desc}</Text>
                </Flex>
              </Flex>
            ))}
        </Flex>
      </Flex>
    </LandingResponsiveContainer>
  );
};
