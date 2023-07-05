import { GAShow } from '@/components/common/GATracker';
import { ColoredInfoIcon } from '@totejs/icons';
import { Flex, FlexProps, Tooltip, TooltipProps } from '@totejs/uikit';
import React, { ReactElement, useState } from 'react';

interface Props extends TooltipProps {
  tips: string | ReactElement | null;
  iconSize: number | string;
  containerWidth: number | string;
  placement?: any;
  offset?: any;
  gaShowName?: string;
}
export const Tips = ({
  tips,
  iconSize,
  containerWidth,
  placement = 'bottom-end',
  offset = [0, 0],
  gaShowName,
  ...restProps
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip
      content={tips}
      minW={containerWidth}
      strategy="fixed"
      placement={placement}
      offset={offset}
      closeDelay={500}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    >
      {/* TODO keep hover style when hover on content */}
      <Flex alignItems={'center'} ml="4px" {...(restProps as FlexProps)} cursor="pointer">
        <ColoredInfoIcon
          width={iconSize}
          height={iconSize}
          _hover={{ color: '#2EC659' }}
          size={'sm'}
        />
        <GAShow isShow={isOpen} name={gaShowName} />
      </Flex>
    </Tooltip>
  );
};
