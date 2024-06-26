import { IconFont } from '@/components/IconFont';
import { GAShow } from '@/components/common/GATracker';
import { Flex, FlexProps, Tooltip, TooltipProps } from '@node-real/uikit';
import { ReactElement, memo, useState } from 'react';
import { DCLink } from '../DCLink';

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
  visibility,
  ...restProps
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip
      // visibility={visibility || 'visible'}
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
          color={'readable.disable'}
          _hover={{ color: 'brand.brand5' }}
          {...iconStyle}
        />
        <GAShow isShow={isOpen} name={gaShowName} />
      </Flex>
    </Tooltip>
  );
};

export type LearnMoreTipsProps = {
  href: string;
  text: string;
};
export const LearnMoreTips = memo<LearnMoreTipsProps>(function LearnMoreTips({ href, text }) {
  return (
    <Tips
      placement={'top'}
      w={'fit-content'}
      onClick={(e) => {
        e.stopPropagation();
      }}
      tips={
        <>
          Learn More about{' '}
          <DCLink href={href} target="_blank" rel="noopener noreferrer">
            {text}
          </DCLink>
          .
        </>
      }
    />
  );
});
