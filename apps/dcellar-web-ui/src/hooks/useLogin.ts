import { useContext } from 'react';

import { LoginContext } from '../context/LoginContext/index';

export const useLogin = () => {
  const val = useContext(LoginContext);
  return val;
};
