import { IconFont } from '@/components/IconFont';
import { INTER_FONT } from '@/modules/wallet/constants';
import { Box, Flex, Text } from '@node-real/uikit';
import { useRef, useState } from 'react';
import Swiper from 'swiper';
import { LandingH2 } from '..';
import FeatureItem from './FeatureItem';
import { keyFeatureList } from './KeyFeatures';

type SwiperRef = HTMLElement & { swiper: Swiper; initialize: () => void };

export const KeyFeaturesMobile = () => {
  const swiperElRef = useRef<SwiperRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Box px={20} my={20}>
      <LandingH2 textAlign={'center'}>Key Features</LandingH2>
      <Box marginTop={24}>
        <Flex justifyContent={'space-between'} alignItems={'center'} mb={16}>
          <button
            onClick={() => {
              setTimeout(() => {
                const index = swiperElRef.current?.swiper.activeIndex;
                setActiveIndex(index !== undefined ? index : 0);
              });
              swiperElRef.current?.swiper.slidePrev();
            }}
          >
            <IconFont
              type="back"
              w={24}
              color={activeIndex === 0 ? 'readable.disable' : 'readable.normal'}
            />
          </button>
          <Text fontFamily={INTER_FONT} fontSize={16} fontWeight={600} mx={28}>
            {keyFeatureList[activeIndex || 0].label}
          </Text>
          <button
            onClick={() => {
              swiperElRef.current?.swiper.slideNext();
              setTimeout(() => {
                const index = swiperElRef.current?.swiper.activeIndex;
                setActiveIndex(index !== undefined ? index : 0);
              });
            }}
          >
            <IconFont
              type="go"
              w={24}
              color={
                activeIndex === keyFeatureList.length - 1 ? 'readable.disable' : 'readable.normal'
              }
            />
          </button>
        </Flex>
        <swiper-container ref={swiperElRef} slides-per-view={1}>
          {keyFeatureList.map((item, index) => (
            <swiper-slide key={index}>
              <FeatureItem {...item} />
            </swiper-slide>
          ))}
        </swiper-container>
      </Box>
    </Box>
  );
};
