import { Box, Flex, Text } from '@totejs/uikit';
import FeatureItem from './FeatureItem';
import { useRef, useState } from 'react';
import Swiper from 'swiper';
import { keyFeatureList } from './KeyFeatures';
import { IconFont } from '@/components/IconFont';

type SwiperRef = HTMLElement & { swiper: Swiper; initialize: () => void };
export const KeyFeaturesMobile = () => {
  const swiperElRef = useRef<SwiperRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <Box px={20} my={20}>
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
          <IconFont type='go-back' w={24} color={ activeIndex === 0 ? 'readable.disable' : 'readable.normal'} />
        </button>
        <Text fontSize={16} fontWeight={600} mx={28}>
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
          <IconFont type='go-amipe20f' w={24} color={ activeIndex === keyFeatureList.length - 1 ? 'readable.disable' : 'readable.normal'} />
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
