import { Flex, Text } from '@totejs/uikit';
import React from 'react';
import { IconFont } from '@/components/IconFont';
import { DISCONTINUED_BANNER_HEIGHT, DISCONTINUED_BANNER_MARGIN_BOTTOM } from '@/utils/constant';

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
      <IconFont type="colored-error2" w={16} />
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
