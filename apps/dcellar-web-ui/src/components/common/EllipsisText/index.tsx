import { Text, TextProps, Tooltip } from '@totejs/uikit';
import React, { memo } from 'react';

interface EllipsisTextProps extends TextProps {
  text?: string;
}

export const EllipsisText = memo((props: EllipsisTextProps) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  return (
    <Tooltip
      content={props.text || props.children}
      visibility={isOverflowing ? 'visible' : 'hidden'}
    >
      <Text
        ref={(ref) => {
          if (!ref) return;
          const isOverflowing = ref.scrollWidth > ref.clientWidth;
          if (isOverflowing) {
            setIsOverflowing(true);
          }
        }}
        overflow={'hidden'}
        whiteSpace={'nowrap'}
        textOverflow={'ellipsis'}
        {...props}
      >
        {props.children}
      </Text>
    </Tooltip>
  );
});
