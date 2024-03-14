import { useAppDispatch } from '@/store';
import { setupGnfdGasFeesConfig } from '@/store/slices/global';
import { useAsyncEffect } from 'ahooks';

export const GasFeesConfigLoader = () => {
  const dispatch = useAppDispatch();

  useAsyncEffect(async () => {
    dispatch(setupGnfdGasFeesConfig());
  }, [dispatch, setupGnfdGasFeesConfig]);

  return <></>;
};
