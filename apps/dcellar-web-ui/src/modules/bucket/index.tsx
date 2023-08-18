import { BucketContainer, PageTitle, PanelContainer } from '@/modules/bucket/bucket.style';
import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupBuckets } from '@/store/slices/bucket';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import { BucketList } from '@/modules/bucket/components/BucketList';
import Head from 'next/head';
import React from 'react';

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
    <BucketContainer>
      <Head>
        <title>Buckets - DCellar</title>
      </Head>
      <PanelContainer>
        <PageTitle>Buckets</PageTitle>
        <NewBucket />
      </PanelContainer>
      <BucketList />
    </BucketContainer>
  );
};
