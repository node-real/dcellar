import { useContext } from 'react';

import { BalanceContext } from '@/context/GlobalContext/BalanceContext';

export const useAvailableBalance = () => {
  return useContext(BalanceContext);
};
