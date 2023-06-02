import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStorageProviders } from '@/utils/sp';
import { IRawSPInfo } from '@/modules/buckets/type';

type TSP = {
  sp: IRawSPInfo;
  sps: IRawSPInfo[];
  isLoading: boolean;
  isError: boolean;
};

export const SPContext = React.createContext<TSP>({} as TSP);

export const SPProvider: React.FC<any> = ({ children }) => {
  const { isLoading, isError, data } = useQuery<any>({
    queryKey: ['getStorageProviders'],
    queryFn: getStorageProviders,
  });
  const finalSps = (data ?? []).filter((v: any) => v?.description?.moniker !== 'QATest');
  const randomIndex = Math.floor(Math.random() * finalSps.length);

  const DefaultSp = {
    isLoading: isLoading,
    isError: isError,
    sp: finalSps[randomIndex],
    sps: finalSps,
  };

  return <SPContext.Provider value={DefaultSp}>{children}</SPContext.Provider>;
};
