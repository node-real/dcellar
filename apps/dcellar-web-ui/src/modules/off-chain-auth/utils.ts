import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { isEmpty } from 'lodash-es';
import { getUtcZeroTimestamp } from '../../utils/time';

export const setOffChainData = ({
  address,
  chainId,
  offChainData,
}: {
  address: string;
  chainId: number;
  offChainData: any;
}) => {
  const key = `${address}-${chainId}`;
  localStorage.setItem(key, JSON.stringify(offChainData));
};

export const getOffChainData = (
  address: string,
  chainId = GREENFIELD_CHAIN_ID,
): {
  expirationTime: number;
  spAddresses: string[];
  seedString: string;
} => {
  const key = `${address}-${chainId}`;
  const offChainData = localStorage.getItem(key);

  return offChainData ? JSON.parse(offChainData) : {};
};

export const removeOffChainData = (address: string, chainId: number) => {
  const key = `${address}-${chainId}`;
  localStorage.removeItem(key);
};

export const checkOffChainDataAvailable = ({
  expirationTime = 0,
  spAddresses = [],
}: {
  expirationTime: number;
  spAddresses: string[];
}) => {
  const utcZeroTimestamp = getUtcZeroTimestamp();

  return expirationTime > utcZeroTimestamp && spAddresses?.length > 0;
};

export const checkHaveSp = (spAddress: string, spAddresses: string[]) => {
  return spAddresses.includes(spAddress);
};

export const checkSpOffChainDataAvailable = ({
  expirationTime,
  spAddresses,
  spAddress,
}: {
  expirationTime: number;
  spAddresses: string[];
  spAddress: string;
}) => {
  if (
    !spAddress ||
    !spAddresses ||
    isEmpty(spAddresses) ||
    expirationTime === 0 ||
    !spAddresses.includes(spAddress)
  ) {
    return false;
  }

  return checkOffChainDataAvailable({ expirationTime, spAddresses });
};

export const getGAOptions = (name: string) => {
  const options: Record<string, string> = {
    MetaMask: 'dc.walletconnect.modal.metamak.click',
    'Trust Wallet': 'dc.walletconnect.modal.trustwallet.click',
  };

  return options[name];
};

export const getGNFDChainId = () => {
  return GREENFIELD_CHAIN_ID;
};
