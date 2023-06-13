import { IconProps } from '@totejs/icons';
import { CenterProps, Center, keyframes } from '@totejs/uikit';

import { LoadingIcon } from '../SvgIcon/LoadingIcon';

export interface LoadingProps extends CenterProps {
  iconSize?: IconProps['boxSize'];
}

export function Loading(props: LoadingProps) {
  const { iconSize, ...restProps } = props;
  return (
    <Center boxSize={'100%'} alignSelf="center" flex={1} {...restProps}>
      <LoadingIcon animation={`${rotate} 1s linear infinite`} boxSize={iconSize} />
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
