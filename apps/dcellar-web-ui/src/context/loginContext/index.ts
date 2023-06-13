import React from 'react';

import { getLoginLocalStorageKey } from '../../utils/constant';

export const LOGIN_STORAGE_KEY = getLoginLocalStorageKey();
export const initialState = {
  address: '',
  seedString: null,
  loading: false,
  errorMessage: null,
  allowDirectDownload: false,
  allowDirectView: false,
};

export const initializer = (initialValue = initialState) => {
  if (typeof window !== 'undefined') {
    const loginStorage = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    return JSON.parse(loginStorage as string) || initialValue;
  }
  return initialState;
};

export interface LoginContextType {
  loginState: {
    address: `0x${string}`;
    seedString: any;
    loading: boolean;
    errorMessage: null | string;
    allowDirectDownload: boolean;
    allowDirectView: boolean;
  };
  loginDispatch: React.Dispatch<any>;
  logout: () => void;
}

export type LoginState = LoginContextType['loginState'];

export const LoginContext = React.createContext<LoginContextType>({} as LoginContextType);

export const LoginReducer = (state: LoginState, action: any) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        address: action.payload.address,
        seedString: action.payload.seedString,
      };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(initialState));
      }

      return {
        ...initialState,
      };
    case 'UPDATE_DOWNLOAD_OPTION':
      return {
        ...state,
        allowDirectDownload: action.payload.allowDirectDownload,
      };
    case 'UPDATE_VIEW_OPTION':
      return {
        ...state,
        allowDirectView: action.payload.allowDirectView,
      };
    default:
      return state;
  }
};
