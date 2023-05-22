import { SPContext } from '@/context/GlobalContext/SPProvider';
import { useContext } from 'react';

export const useSPs = () => {
  return useContext(SPContext);
};
