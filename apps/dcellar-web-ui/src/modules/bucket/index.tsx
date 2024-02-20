import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupBuckets } from '@/store/slices/bucket';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import { BucketList } from '@/modules/bucket/components/BucketList';
import Head from 'next/head';
import React from 'react';
import { Box, Flex } from '@node-real/uikit';
import { runtimeEnv } from '@/base/env';
import { networkTag } from '@/utils/common';

export const BucketPage = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const documentVisibility = useDocumentVisibility();

  useUpdateEffect(() => {
    if (documentVisibility !== 'visible') return;
    if (!loginAccount) return;
    dispatch(setupBuckets(loginAccount));
  }, [documentVisibility]);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBuckets(loginAccount));
  }, [loginAccount, dispatch]);

  return (
    <>
      <Head>
        <title>Buckets - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
      <Flex mb={16} alignItems="center" justifyContent="space-between">
        <Box as="h1" fontSize={24} fontWeight={700}>
          Buckets
        </Box>
        <NewBucket />
      </Flex>
      <BucketList />
    </>
  );
};
