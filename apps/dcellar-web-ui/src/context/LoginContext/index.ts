import React from 'react';

export interface LoginContextType {
  logout: (removeSpAuth?: boolean) => void;
}

export const LoginContext = React.createContext<LoginContextType>({} as LoginContextType);
