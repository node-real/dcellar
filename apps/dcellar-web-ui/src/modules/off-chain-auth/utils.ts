import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-storage-js-sdk';
import { isEmpty } from 'lodash-es';

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
  expirationTimestamp: number;
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
  expirationTimestamp = 0,
  spAddresses = [],
}: {
  expirationTimestamp: number;
  spAddresses: string[];
}) => {
  const utcZeroTimestamp = getUtcZeroTimestamp();

  return expirationTimestamp > utcZeroTimestamp && spAddresses?.length > 0;
};

export const checkHaveSp = (spAddress: string, spAddresses: string[]) => {
  return spAddresses.includes(spAddress);
};

export const checkSpOffChainDataAvailable = ({
  expirationTimestamp,
  spAddresses,
  spAddress,
}: {
  expirationTimestamp: number;
  spAddresses: string[];
  spAddress: string;
}) => {
  if (
    !spAddress ||
    !spAddresses ||
    isEmpty(spAddresses) ||
    expirationTimestamp === 0 ||
    !spAddresses.includes(spAddress)
  ) {
    return false;
  }

  return checkOffChainDataAvailable({ expirationTimestamp, spAddresses });
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
