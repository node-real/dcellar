import { memo } from 'react';
import { CreateBucket } from '@/modules/bucket/bucket.style';
import { AddIcon } from '@totejs/icons';

interface NewBucketProps {}

export const NewBucket = memo<NewBucketProps>(function NewBucket() {
  return (
    <CreateBucket variant="dcPrimary" leftIcon={<AddIcon />} iconSpacing={8}>
      New Bucket
    </CreateBucket>
  );
});
