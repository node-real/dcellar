import { GREENFIELD_CHAIN_ID } from "@/base/env"
import { getUtcZeroTimestamp } from "@bnb-chain/greenfield-storage-js-sdk"

export const setOffChainData = ({ address, chainId, offChainData }: { address: string, chainId: number, offChainData: any }) => {
  const key = `${address}-${chainId}`
  localStorage.setItem(key, JSON.stringify(offChainData))
}

export const getOffChainData = (address: string, chainId = GREENFIELD_CHAIN_ID) => {
  const key = `${address}-${chainId}`
  const offChainData = localStorage.getItem(key)

  return offChainData ? JSON.parse(offChainData) : {}
}

export const removeOffChainData = (address: string, chainId: number) => {
  const key = `${address}-${chainId}`
  localStorage.removeItem(key)
}

export const checkOffChainDataAvailable = (offChainData: any) => {
  const { expirationTimestamp = 0 } = offChainData || {};
  const utcZeroTimestamp = getUtcZeroTimestamp();

  return expirationTimestamp > utcZeroTimestamp
}


export const getGAOptions = (name: string) => {
  const options: Record<string, string> = {
    MetaMask: 'dc.walletconnect.modal.metamak.click',
    'Trust Wallet': 'dc.walletconnect.modal.trustwallet.click',
  };

  return options[name];
}

export const getGNFDChainId = () => {
  return GREENFIELD_CHAIN_ID;
}