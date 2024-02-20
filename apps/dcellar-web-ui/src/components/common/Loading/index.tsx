import { IconProps } from '@node-real/icons';
import { CenterProps, Center, keyframes } from '@node-real/uikit';

import { LoadingIcon } from '../SvgIcon/LoadingIcon';

export interface LoadingProps extends CenterProps {
  iconSize?: IconProps['boxSize'];
  strokeWidth?: number;
  stroke?: string;
}

export function Loading(props: LoadingProps) {
  const { iconSize, stroke = '#00BA34', strokeWidth = 4, ...restProps} = props;

  return (
    <Center boxSize={'100%'} alignSelf="center" flex={1} {...restProps}>
      <LoadingIcon
        strokeWidth={strokeWidth}
        stroke={stroke}
        animation={`${rotate} 1s linear infinite`}
        boxSize={iconSize}
      />
    </Center>
  );
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;
