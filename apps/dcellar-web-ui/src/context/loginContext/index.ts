import React from 'react';

import { getLoginLocalStorageKey } from '../../utils/constant';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { removeOffChainData } from '@/modules/off-chain-auth/utils';

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
};

export interface LoginState {
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

export const LoginContext = React.createContext<LoginState>(null as any);

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
      removeOffChainData(state?.address, GREENFIELD_CHAIN_ID);

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
