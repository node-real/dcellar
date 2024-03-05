import { createContext, memo, PropsWithChildren, useContext } from 'react';

export type GAContextType = { prefix: string };

export const GAContext = createContext<GAContextType>({ prefix: '' });

export const GAContextProvider = memo<PropsWithChildren<GAContextType>>(
  function GAContextProvider(props) {
    const { prefix: parent } = useContext(GAContext);
    const { children, prefix: current } = props;
    const prefix = [parent, current].filter(Boolean).join('.');

    return <GAContext.Provider value={{ prefix }}>{children}</GAContext.Provider>;
  },
);
