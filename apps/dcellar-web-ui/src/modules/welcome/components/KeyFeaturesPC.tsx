import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@totejs/uikit';
import { LandingH2, LandingResponsiveContainer } from '..';
import { keyFeatureList } from './KeyFeatures';
import FeatureItem from './FeatureItem';
import { memo } from 'react';
import { GAClick } from '@/components/common/GATracker';

export const KeyFeaturesPC = memo(() => {
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
      <Flex flexDirection={'column'} alignItems={'center'} my={40}>
        <LandingH2 marginBottom={40}>Key Features</LandingH2>
        <Tabs
          variant="squared"
          alignItems={'center'}
          justifyContent={'center'}
          isLazy={false}
          lazyBehavior="keepMounted"
        >
          <TabList flexWrap={'wrap'} justifyContent={'center'}>
            {keyFeatureList &&
              keyFeatureList.map((item, index) => (
                <GAClick key={index} name={item.gaClickName}>
                  <Tab key={index} {...styles}>
                    <Text>{item.label}</Text>
                    {item.tag && (
                      <Text fontSize={12} fontWeight={500} color={'readable.disabled'}>
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