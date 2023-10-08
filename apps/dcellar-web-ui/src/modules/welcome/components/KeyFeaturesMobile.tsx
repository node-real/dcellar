import { Box, Flex, Text } from '@totejs/uikit';
import FeatureItem from './FeatureItem';
import { useRef, useState } from 'react';
import Swiper from 'swiper';
import { keyFeatureList } from './KeyFeatures';

type SwiperRef = HTMLElement & { swiper: Swiper; initialize: () => void };
export const KeyFeaturesMobile = () => {
  const swiperElRef = useRef<SwiperRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <Box px={20} my={20}>
      <Flex justifyContent={'space-between'}>
        <button
          onClick={() => {
            setTimeout(() => {
              const index = swiperElRef.current?.swiper.activeIndex;
              setActiveIndex(index !== undefined ? index : 0);
            });
            swiperElRef.current?.swiper.slidePrev();
          }}
        >
          Previous
        </button>
        <Text fontSize={16} fontWeight={600}>
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
          Next
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
  );
};
