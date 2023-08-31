import { chains } from '@/context/WalletConnectContext/chains';
import { TrustWalletConnector } from '@/context/WalletConnectContext/connectors/TrustWalletConnector';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

const trustWalletConnector = new TrustWalletConnector({ chains })
const metaMaskConnector = new MetaMaskConnector({ chains })

export const connectors = [trustWalletConnector, metaMaskConnector];
