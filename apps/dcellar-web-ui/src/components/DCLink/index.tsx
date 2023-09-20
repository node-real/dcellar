import { memo } from 'react';
import { Link, LinkProps } from '@totejs/uikit';

interface DCLinkProps extends LinkProps {}

export const DCLink = memo<DCLinkProps>(function DCLink(props) {
  return (
    <Link
      color="brand.normal"
      textDecoration="underline"
      _hover={{ color: 'brand.brand5' }}
      {...props}
    />
  );
});
