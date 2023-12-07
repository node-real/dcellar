// import { type PublicClient, type WalletClient } from "wagmi";
import { providers } from "ethers";
import { type HttpTransport } from "viem";

export function walletClientToSigner(walletClient: any) {
  const { account, chains, transport } = walletClient;
  const network = {
    chainId: chains[0].id,
    name: chains[0].name,
    ensAddress: '0xca11bde05977b3631167028862be2a173976ca11',
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export function publicClientToProvider(publicClient: any) {
  const { chains, transport } = publicClient;
  const network = {
    chainId: chains[0].id,
    name: chains[0].name,
    ensAddress: '0xca11bde05977b3631167028862be2a173976ca11',
  };
  // if (transport.type === "fallback")
  //   return new providers.FallbackProvider(
  //     (transport.transports as ReturnType<HttpTransport>[]).map(
  //       ({ value }) => new providers.JsonRpcProvider(value?.url, network),
  //     ),
  //   );
  return new providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545', network);
}
