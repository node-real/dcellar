import React from 'react';
import { StorageProvider } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { useQuery } from '@tanstack/react-query';

import { getStorageProviders } from '@/modules/buckets/List/utils';

type TSP = {
  sp: StorageProvider;
  sps: StorageProvider[];
  isLoading: boolean;
  isError: boolean;
};

const getRandomSP = (sps: StorageProvider[]) => {
  if (!sps || sps.length === 0) {
    return {} as StorageProvider;
  }
  // TODO remove this filter after nodereal is ready
  const tempFilterSps = sps.filter((v) => v?.description?.moniker !== 'Nodereal');
  const randomIndex = Math.floor(Math.random() * tempFilterSps.length);

  return tempFilterSps[randomIndex];
};

export const SPContext = React.createContext<TSP>({} as TSP);

export const SPProvider: React.FC<any> = ({ children }) => {
  const { isLoading, isError, data } = useQuery<any>({
    queryKey: ['getStorageProviders'],
    queryFn: getStorageProviders,
  });
  const finalSps = (data?.sps ?? []).filter((v: any) => v?.description?.moniker !== 'QATest');

  const DefaultSp = {
    isLoading: isLoading,
    isError: isError,
    sp: getRandomSP(finalSps),
    sps: finalSps,
  } as TSP;

  return <SPContext.Provider value={DefaultSp}>{children}</SPContext.Provider>;
};
