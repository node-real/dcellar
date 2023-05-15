import React, { ReactNode, useReducer, useEffect } from 'react';

import { LoginReducer, LoginContext, initializer, initialState, LOGIN_STORAGE_KEY } from './index';

interface LoginContextProviderProps {
  children: ReactNode;
}

const LoginContextProvider: React.ComponentType<LoginContextProviderProps> = (
  props: LoginContextProviderProps,
) => {
  const { children } = props;
  const [loginState, loginDispatch] = useReducer(LoginReducer, initialState, initializer);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(loginState));
    }
  }, [loginState]);
  return (
    <LoginContext.Provider value={{ loginState, loginDispatch }}>{children}</LoginContext.Provider>
  );
};
LoginContextProvider.displayName = 'LoginContextProvider';
export default LoginContextProvider;
