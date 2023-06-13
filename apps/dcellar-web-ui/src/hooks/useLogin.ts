import { useContext } from 'react';

import { LoginContext, LoginContextType } from '../context/LoginContext/index';

export const useLogin = () => {
  const val = useContext(LoginContext);
  return val as LoginContextType;
};
