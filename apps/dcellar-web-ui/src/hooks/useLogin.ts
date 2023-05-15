import { useContext } from 'react';

import { LoginContext } from '../context/loginContext/index';

export const useLogin = () => {
  const val = useContext(LoginContext);
  return val;
};
