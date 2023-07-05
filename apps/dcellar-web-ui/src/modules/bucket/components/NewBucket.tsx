import { memo } from 'react';
import { CreateBucketButton } from '@/modules/bucket/bucket.style';
import { AddIcon } from '@totejs/icons';
import { BucketDrawer } from '@/modules/bucket/components/BucketDrawer';
import { useAppDispatch } from '@/store';
import { setEditCreate } from '@/store/slices/bucket';

interface NewBucketProps {}

export const NewBucket = memo<NewBucketProps>(function NewBucket() {
  const dispatch = useAppDispatch();

  return (
    <>
      <BucketDrawer />
      <CreateBucketButton
        variant="dcPrimary"
        leftIcon={<AddIcon />}
        iconSpacing={8}
        onClick={() => dispatch(setEditCreate(true))}
      >
        New Bucket
      </CreateBucketButton>
    </>
  );
});
