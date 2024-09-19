import { BucketList } from '@/modules/bucket/components/BucketList';
import { CreateBucket } from '@/modules/bucket/components/CreateBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectHasDiscontinueBucket, setupBucketList } from '@/store/slices/bucket';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import { PageTitle } from '@/components/layout/PageTitle';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { BucketOperations } from '@/modules/bucket/components/BucketOperations';
import { GAContextProvider } from '@/context/GAContext';

export const BucketPage = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const hasDiscontinueBucket = useAppSelector(selectHasDiscontinueBucket(loginAccount));

  const documentVisibility = useDocumentVisibility();

  useUpdateEffect(() => {
    if (documentVisibility !== 'visible') return;
    if (!loginAccount) return;
    dispatch(setupBucketList(loginAccount));
  }, [documentVisibility]);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBucketList(loginAccount));
  }, [loginAccount, dispatch]);

  return (
    <GAContextProvider prefix={'dc.bucket'}>
      <BucketOperations />
      <PageTitle title={'Buckets'} metaTitle={'Buckets'}>
        <CreateBucket />
      </PageTitle>
      {hasDiscontinueBucket && (
        <DiscontinueBanner
          content="Some items were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={44}
          marginBottom={16}
        />
      )}
      <BucketList />
    </GAContextProvider>
  );
};
