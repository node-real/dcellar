import { GAClick } from '@/components/common/GATracker';
import { INTER_FONT } from '@/modules/wallet/constants';
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@node-real/uikit';
import { memo } from 'react';
import { LandingH2, LandingResponsiveContainer } from '..';
import FeatureItem from './FeatureItem';
import { keyFeatureList } from './KeyFeatures';

export const KeyFeaturesPC = memo(function KeyFeaturesPC() {
  const styles = {
    px: 16,
    py: 12,
    borderRadius: 4,
    fontSize: 16,
    fontWeight: 600,
    color: 'readable.tertiary',
    _selected: {
      color: 'readable.normal',
      bg: 'rgba(0, 186, 52, 0.10)',
      _hover: {
        color: 'readable.normal',
        bg: 'rgba(0, 186, 52, 0.2)',
      },
    },
    _hover: {
      color: 'readable.tertiary',
      bg: 'bg.bottom',
    },
  };

  return (
    <LandingResponsiveContainer>
      <Flex flexDirection={'column'} alignItems={'center'} my={80}>
        <LandingH2 marginBottom={40}>Key Features</LandingH2>
        <Tabs
          variant="squared"
          alignItems={'center'}
          justifyContent={'center'}
          isLazy={false}
          trigger="hover"
        >
          <TabList flexWrap={'wrap'} justifyContent={'center'} marginBottom={33}>
            {keyFeatureList &&
              keyFeatureList.map((item, index) => (
                <GAClick key={index} name={item.gaClickName}>
                  <Tab key={index} {...styles} position={'relative'}>
                    <Text fontFamily={INTER_FONT}>{item.label}</Text>
                    {item.tag && (
                      <Text
                        position={'absolute'}
                        bottom={0}
                        fontFamily={INTER_FONT}
                        fontSize={12}
                        fontWeight={500}
                        color={'readable.disabled'}
                      >
                        {item.tag}
                      </Text>
                    )}
                  </Tab>
                </GAClick>
              ))}
          </TabList>
          <TabPanels>
            {keyFeatureList &&
              keyFeatureList.map((item, index) => (
                <TabPanel key={index}>
                  <FeatureItem {...item} />
                </TabPanel>
              ))}
          </TabPanels>
        </Tabs>
      </Flex>
    </LandingResponsiveContainer>
  );
});
