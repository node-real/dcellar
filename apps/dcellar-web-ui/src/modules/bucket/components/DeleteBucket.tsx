import { memo, useEffect, useState } from 'react';
import { DeleteBucket as LegacyDeleteBucket } from '@/modules/buckets/List/components/DeleteBucket';
import { useAppDispatch, useAppSelector } from '@/store';
import { BucketItem, setEditDelete, setupBuckets } from '@/store/slices/bucket';

interface DeleteBucketProps {}

export const DeleteBucket = memo<DeleteBucketProps>(function DeleteBucket() {
  const dispatch = useAppDispatch();
  const { editDelete, bucketInfo } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { spInfo } = useAppSelector((root) => root.sp);
  const isOpen = !!editDelete.bucket_name;
  const [open, setOpen] = useState(isOpen);
  const bucket = bucketInfo[editDelete.bucket_name] || {};
  const primarySp = bucket.primary_sp_address;
  const sp = spInfo[primarySp] || {};

  useEffect(() => {
    if (!isOpen) return;
    setOpen(isOpen);
  }, [isOpen, dispatch]);

  const onClose = () => {
    setOpen(false);
    setTimeout(() => {
      dispatch(setEditDelete({} as BucketItem));
    }, 200);
  };

  const refetch = () => {
    dispatch(setupBuckets(loginAccount));
  };

  return isOpen ? (
    <LegacyDeleteBucket
      bucketName={editDelete.bucket_name || ''}
      isOpen={open}
      onClose={onClose}
      refetch={refetch}
      sp={{
        address: primarySp,
        endpoint: sp.endpoint,
      }}
    />
  ) : null;
});
