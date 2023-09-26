import { Flex, FlexProps } from '@totejs/uikit';
import React, { memo } from 'react';

import { IconFont } from '@/components/IconFont';

type SwapIconProps = FlexProps & {
  onClick: React.MouseEventHandler<HTMLDivElement>;
};

export const SwapIcon = memo<SwapIconProps>(function ({ onClick, ...props }) {
  return (
    <Flex
      width={'28px'}
      height="28px"
      alignItems={'center'}
      justifyContent="center"
      border={'1px solid #EAECF0'}
      color="readable.primary"
      borderRadius={'50%'}
      mt="28px"
      cursor="pointer"
      _hover={{
        backgroundColor: 'brand.brand6',
        color: 'white',
        border: 'none',
      }}
      onClick={onClick}
      {...props}
    >
      <IconFont w={16} type={'revert-h'} />
    </Flex>
  );
});
