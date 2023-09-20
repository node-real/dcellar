import { GAShow } from '@/components/common/GATracker';
import { Flex, FlexProps, Tooltip, TooltipProps } from '@totejs/uikit';
import React, { ReactElement, useState } from 'react';
import { IconFont } from '@/components/IconFont';

interface Props extends TooltipProps {
  tips: string | ReactElement | null;
  iconSize?: number | string;
  containerWidth?: number | string;
  placement?: any;
  offset?: any;
  gaShowName?: string;
  iconStyle?: { [key: string]: any };
}

export const Tips = ({
  tips,
  iconSize = 16,
  containerWidth = 240,
  placement = 'bottom-end',
  offset = [0, 0],
  gaShowName,
  iconStyle,
  ...restProps
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Tooltip
      content={tips}
      w={containerWidth}
      strategy="fixed"
      placement={placement}
      offset={offset}
      closeDelay={500}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      {...(restProps as FlexProps)}
    >
      <Flex alignItems={'center'} ml="4px" cursor="pointer">
        <IconFont
          type="colored-info"
          w={iconSize}
          color={'readable.disabled'}
          _hover={{ color: 'brand.brand5' }}
          {...iconStyle}
        />
        <GAShow isShow={isOpen} name={gaShowName} />
      </Flex>
    </Tooltip>
  );
};
