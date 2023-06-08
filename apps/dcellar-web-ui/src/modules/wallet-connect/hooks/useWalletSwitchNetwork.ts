import { switchNetworkErrorHandler } from '@/modules/wallet-connect/error/switchNetworkErrorHandler';
import { useSwitchNetwork } from 'wagmi';

export type UseWalletSwitchNetworkParams = Parameters<typeof useSwitchNetwork>[0];

export function useWalletSwitchNetWork(params?: UseWalletSwitchNetworkParams) {
  return useSwitchNetwork({
    throwForSwitchChainNotSupported: true,
    onError: switchNetworkErrorHandler(),
    ...params,
  });
}