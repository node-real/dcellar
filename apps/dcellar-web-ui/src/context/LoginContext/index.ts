import React from 'react';

export interface LoginContextType {
  logout: () => void;
}

export const LoginContext = React.createContext<LoginContextType>({} as LoginContextType);
