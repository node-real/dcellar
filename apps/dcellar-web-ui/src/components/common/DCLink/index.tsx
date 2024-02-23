import { Link, LinkProps } from '@node-real/uikit';
import { memo } from 'react';

interface DCLinkProps extends LinkProps {}

export const DCLink = memo<DCLinkProps>(function DCLink(props) {
  const { color = 'brand.normal', onClick } = props;

  return (
    <Link
      tabIndex={-1}
      color={color}
      textDecoration="underline"
      _hover={{ color: 'brand.brand5', textDecoration: 'underline' }}
      onClick={(e) => {
        const element = document.activeElement as HTMLAnchorElement;
        element?.blur();
        onClick?.(e);
      }}
      {...props}
    />
  );
});
