import { chains } from '@/context/WalletConnectContext/chains';
import { MetaMaskConnector } from '@/context/WalletConnectContext/connectors/MetaMaskConnector';
import { TrustWalletConnector } from '@/context/WalletConnectContext/connectors/TrustWalletConnector';

const trustWalletConnector = new TrustWalletConnector({ chains })
const metaMaskConnector = new MetaMaskConnector({ chains })

export const connectors = [trustWalletConnector, metaMaskConnector];
