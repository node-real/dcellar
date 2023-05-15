import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { Box, BoxProps } from '@totejs/uikit';
import { useColorMode } from '@totejs/uikit';

import LightLogo from '@/public/images/icons/logo.svg';

interface ILogo extends BoxProps {
  href: string;
  alt?: string;
  title?: string;
  target?: string;
}
export const Logo: React.FC<ILogo> = (props) => {
  const { href, target = '', title = '', ...restProps } = props;
  const { basePath } = useRouter();
  const { colorMode } = useColorMode();
  const logo = colorMode === 'light' ? <LightLogo /> : <LightLogo />;

  return (
    <Box {...restProps}>
      {basePath ? (
        <a href={href} target={target} title={title}>
          {logo}
        </a>
      ) : (
        <Link href={href} target={target} title={title}>
          {logo}
        </Link>
      )}
    </Box>
  );
};
