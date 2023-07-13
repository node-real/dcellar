import { memo, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditCreate, setupBuckets } from '@/store/slices/bucket';
import { CreateBucket as LegacyCreateBucket } from '@/modules/buckets/List/components/CreateBucket';

interface BucketDrawerProps {}

export const BucketDrawer = memo<BucketDrawerProps>(function BucketDrawer() {
  const dispatch = useAppDispatch();
  const { editCreate } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOpen = editCreate;
  const [open, setOpen] = useState(isOpen); // for modal close animation

  useEffect(() => {
    if (!isOpen) return;
    setOpen(isOpen);
  }, [isOpen, dispatch]);

  const onClose = () => {
    setOpen(false);
    setTimeout(() => {
      dispatch(setEditCreate(false));
      // todo fix it
      document.documentElement.style.overflowY = '';
    }, 200);
  };

  const refetch = () => {
    dispatch(setupBuckets(loginAccount));
  };

  return isOpen ? <LegacyCreateBucket isOpen={open} refetch={refetch} onClose={onClose} /> : null;
});
