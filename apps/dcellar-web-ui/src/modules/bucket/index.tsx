import {
  BucketContainer,
  CreateBucket,
  PageTitle,
  PanelContainer,
} from '@/modules/bucket/bucket.style';
import { AddIcon } from '@totejs/icons';
import { useMount } from 'ahooks';

export const BucketPage = () => {
  useMount(() => {});

  return (
    <BucketContainer>
      <PanelContainer>
        <PageTitle>Buckets</PageTitle>
        <CreateBucket variant="dcPrimary" leftIcon={<AddIcon />} iconSpacing={8}>
          New Bucket
        </CreateBucket>
      </PanelContainer>
    </BucketContainer>
  );
};
