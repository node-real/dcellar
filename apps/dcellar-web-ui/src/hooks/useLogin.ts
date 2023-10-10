import { useContext } from 'react';

import { LoginContext } from '@/context/LoginContext';

export const useLogin = () => {
  return useContext(LoginContext);
};
