import { BucketContainer, PageTitle, PanelContainer } from '@/modules/bucket/bucket.style';
import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBucketList, setupBuckets } from '@/store/slices/bucket';
import { useAsyncEffect } from 'ahooks';
import { BucketList } from '@/modules/bucket/components/BucketList';

export const BucketPage = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const bucketList = useAppSelector(selectBucketList(loginAccount));

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    await dispatch(setupBuckets(loginAccount));
  }, [loginAccount, dispatch]);

  return (
    <BucketContainer>
      <PanelContainer>
        <PageTitle>Buckets</PageTitle>
        {!!bucketList.length && <NewBucket />}
      </PanelContainer>
      <BucketList />
    </BucketContainer>
  );
};
