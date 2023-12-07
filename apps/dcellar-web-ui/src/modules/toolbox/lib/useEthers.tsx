import React from "react";
import { publicClientToProvider, walletClientToSigner } from "./ethers";
import { useProvider, useSigner } from "wagmi";

export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const publicClient = useProvider({ chainId });
  console.log('publicClient', publicClient);
  return React.useMemo(() => publicClientToProvider(publicClient), [publicClient]);
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useSigner({ chainId });
  return React.useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);
}
