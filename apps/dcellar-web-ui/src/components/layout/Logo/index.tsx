import { IconFont } from '@/components/IconFont';
import { Box, BoxProps } from '@node-real/uikit';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

interface ILogo extends BoxProps {
  href: string;
  alt?: string;
  title?: string;
  target?: string;
}

export const Logo: React.FC<ILogo> = (props) => {
  const { href, target = '', title = '', ...restProps } = props;
  const { basePath } = useRouter();
  const logo = <IconFont w={132} h={26} type={'logo'} />;

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
