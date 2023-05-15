import React from 'react';

import { getLoginLocalStorageKey } from '../../utils/constant';

export const LOGIN_STORAGE_KEY = getLoginLocalStorageKey();
export const initialState = {
  address: '',
  seedString: null,
  loading: false,
  errorMessage: null,
  allowDirectDownload: false,
};

export const initializer = (initialValue = initialState) => {
  if (typeof window !== 'undefined') {
    const loginStorage = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    return JSON.parse(loginStorage as string) || initialValue;
  }
};

export interface LoginState {
  loginState: {
    address: `0x${string}`;
    seedString: any;
    loading: boolean;
    errorMessage: null | string;
    allowDirectDownload: boolean;
  };
  loginDispatch: React.Dispatch<any>;
}

export const LoginContext = React.createContext<LoginState>(null as any);
LoginContext.displayName = 'LoginContext';

export const LoginReducer = (state: any, action: any) => {
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
    default:
      return state;
  }
};
