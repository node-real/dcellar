import { Flex, FlexProps } from '@node-real/uikit';
import { MouseEventHandler, memo } from 'react';

import { IconFont } from '@/components/IconFont';

type SwapIconProps = FlexProps & {
  onClick: MouseEventHandler<HTMLDivElement>;
};

export const SwapButton = memo<SwapIconProps>(function SwapIcon({ onClick, ...props }) {
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
