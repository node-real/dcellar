import { IconFont } from '@/components/IconFont';
import { DISCONTINUED_BANNER_HEIGHT, DISCONTINUED_BANNER_MARGIN_BOTTOM } from '@/constants/legacy';
import { Flex, Text } from '@node-real/uikit';
import { ReactNode } from 'react';

export const DiscontinueBanner = ({
  content,
  height = DISCONTINUED_BANNER_HEIGHT,
  marginBottom = DISCONTINUED_BANNER_MARGIN_BOTTOM,
  bg = 'rgba(238, 57, 17, 0.1)',
  color = '#CA300E',
  icon = <IconFont type="colored-error2" w={16} />,
}: {
  content: string;
  height?: number;
  marginBottom?: number;
  bg?: string;
  color?: string;
  icon?: ReactNode;
}) => {
  return (
    <Flex
      minHeight={`${height}px`}
      marginBottom={`${marginBottom}px`}
      alignItems={'center'}
      borderRadius={'4px'}
      background={bg}
      color={color}
      p={8}
    >
      {icon}
      <Text
        fontSize={'14px'}
        marginLeft={'4px'}
        overflow={'hidden'}
        // textOverflow={'ellipsis'}
        // whiteSpace={'nowrap'}
      >
        {content}
      </Text>
    </Flex>
  );
};
