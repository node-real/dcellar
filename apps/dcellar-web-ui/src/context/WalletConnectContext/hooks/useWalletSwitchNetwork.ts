import { handleWalletError } from '@/context/WalletConnectContext/error/handleWalletError';
import { useSwitchNetwork } from 'wagmi';

export type UseWalletSwitchNetworkParams = Parameters<typeof useSwitchNetwork>[0];

export function useWalletSwitchNetWork(params?: UseWalletSwitchNetworkParams) {
  return useSwitchNetwork({
    throwForSwitchChainNotSupported: true,
    onError: handleWalletError,
    ...params,
  });
}
