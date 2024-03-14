import Head from 'next/head';
import { memo, PropsWithChildren } from 'react';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';
import { Box, Flex } from '@node-real/uikit';

interface PageTitleProps {
  title: string;
  metaTitle?: string;
}

export const PageTitle = memo<PropsWithChildren<PageTitleProps>>(function PageTitle({
  title,
  metaTitle,
  children,
}) {
  return (
    <>
      {metaTitle && (
        <Head>
          <title>
            {metaTitle} - DCellar{networkTag(runtimeEnv)}
          </title>
        </Head>
      )}
      <Flex mb={16} alignItems={'center'} justifyContent={'space-between'}>
        <Box as={'h1'} fontSize={24} fontWeight={700}>
          {title}
        </Box>
        {children}
      </Flex>
    </>
  );
});
