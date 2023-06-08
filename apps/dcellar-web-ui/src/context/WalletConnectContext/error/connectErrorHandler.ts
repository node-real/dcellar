import { METAMASK_DOWNLOAD_URL, TRUST_WALLET_DOWNLOAD_URL } from '@/constants/links';
import { ConnectErrorCodeMsgMap } from '@/context/WalletConnectContext/error/error';
import { handleCommonError } from '@/context/WalletConnectContext/error/handleCommonError';
import { toast } from '@totejs/uikit';
import { Connector, ConnectorNotFoundError } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

export interface ConnectorArgs {
  connector: Connector;
  [x: string]: any;
}

export type CustomConnectErrorHandler = (
  err: Error,
  variables?: ConnectorArgs,
  context?: unknown,
) => unknown;

export function connectErrorHandler(fn?: CustomConnectErrorHandler) {
  const handleError = (err: any, variables: ConnectorArgs, context: unknown) => {
    const { connector } = variables;

    switch (true) {
      case err instanceof ConnectorNotFoundError:
        if (connector instanceof MetaMaskConnector) {
          toast.warning({
            description: `Metamask not installed. Please install and reconnect.`,
          });

          window.open(METAMASK_DOWNLOAD_URL, '_blank');
        } else if (connector instanceof InjectedConnector && connector.name === 'Trust Wallet') {
          toast.warning({
            description: `Trust wallet not installed. Please install and reconnect.`,
          });

          window.open(TRUST_WALLET_DOWNLOAD_URL, '_blank');
        } else {
          toast.warning({
            description: `Wallet not installed. Please install and reconnect.`,
          });
        }
        break;
      default:
        handleCommonError(
          err,
          ConnectErrorCodeMsgMap,
          `Oops, connect wallet met error, please try again.`,
        );
    }
  };

  return (err: Error, variables: ConnectorArgs, context: unknown) => {
    handleError(err, variables, context);
    fn?.(err, variables, context);
  };
}
