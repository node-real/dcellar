import { ObjectsPage } from '@/modules/object';
import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { setSelectedRowKeys } from '@/store/slices/object';
export default function Objects() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setSelectedRowKeys([]));
  }, [dispatch]);
  return <ObjectsPage />;
}
