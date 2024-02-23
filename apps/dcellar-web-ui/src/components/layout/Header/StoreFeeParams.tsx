import { useAppDispatch } from '@/store';
import { setupStoreFeeParams } from '@/store/slices/global';
import { useAsyncEffect } from 'ahooks';

export const StoreFeeParams = () => {
  const dispatch = useAppDispatch();
  useAsyncEffect(async () => {
    dispatch(setupStoreFeeParams());
  }, [dispatch, setupStoreFeeParams]);

  return <></>;
};
