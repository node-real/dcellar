import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { Box, BoxProps } from '@totejs/uikit';
import { IconFont } from '@/components/IconFont';

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
