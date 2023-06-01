import { Box, Flex, Text } from '@totejs/uikit';
import React from 'react';
import WaringTriangleIcon from '@/public/images/icons/warning-triangle.svg';
import { DISCONTINUED_BANNER_HEIGHT, DISCONTINUED_BANNER_MARGIN_BOTTOM } from '@/constants/common';

export const DiscontinueBanner = ({
  content,
  height = DISCONTINUED_BANNER_HEIGHT,
  marginBottom = DISCONTINUED_BANNER_MARGIN_BOTTOM,
}: {
  content: string;
  height?: number;
  marginBottom?: number;
}) => {
  return (
    <Flex
      height={`${height}px`}
      marginBottom={`${marginBottom}px`}
      paddingLeft={'16px'}
      alignItems={'center'}
      borderRadius={'8px'}
      background={'rgba(238, 57, 17, 0.1)'}
      color="#CA300E"
    >
      <WaringTriangleIcon />
      <Text
        fontSize={'14px'}
        marginLeft={'4px'}
        overflow={'hidden'}
        textOverflow={'ellipsis'}
        whiteSpace={'nowrap'}
      >
        {content}
      </Text>
    </Flex>
  );
};
