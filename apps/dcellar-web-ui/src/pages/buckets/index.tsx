import React, { useEffect } from 'react';
import { BucketPage } from '@/modules/bucket';
import { useAppDispatch } from '@/store';
import { setSelectedRowKeys } from '@/store/slices/object';
export default function Bucket() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setSelectedRowKeys([]));
  }, [dispatch]);
  return <BucketPage />;
}
