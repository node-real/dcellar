import { Flex, FlexProps } from '@totejs/uikit';
import React, { memo } from 'react';

import SwapSvgIcon from '@/public/images/icons/swap.svg';

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
        backgroundColor: 'readable.brand6',
        color: 'white',
        border: 'none',
      }}
      onClick={onClick}
      {...props}
    >
      <SwapSvgIcon />
    </Flex>
  );
});
