import { ErrorMsgMap } from '@/context/WalletConnectContext/error/error';
import { toast } from '@totejs/uikit';
import { ConnectorNotFoundError } from 'wagmi';
import * as Sentry from '@sentry/nextjs';
import { disconnect } from '@wagmi/core';
import { parseWCMessage } from '@/utils/common';

export function handleWalletError(err: any, args: any, context: unknown) {
  let text = '';

  switch (true) {
    case err instanceof ConnectorNotFoundError:
      const { connector } = args;
      if (connector.id === 'metaMask') {
        text = `Metamask not installed. Please install and reconnect.`;
      } else if (connector.id === 'trust') {
        text = `Trust wallet not installed. Please install and reconnect.`;
      } else {
        text = `Wallet not installed. Please install and reconnect.`;
      }
      break;
  }
  const code = err.cause?.code ?? err.code;
  const message = parseWCMessage(err.cause?.message) ?? err.message;
  const description = text || ErrorMsgMap[code] || message;

  Sentry.withScope((scope) => {
    scope.setTag('Component', 'handleWalletError');
    Sentry.captureMessage(JSON.stringify(err));
  });

  // Compatible the walletConnect cannot switch network
  if (JSON.stringify(err).includes("Cannot set properties of undefined (setting 'defaultChain')") || JSON.stringify(err).includes("undefined has no properties")) {
    toast.error({
      description: 'Sorry, it seems like we lost the connection of your wallet, please login again to continue.'
    });
    return disconnect()
  }

  toast.error({
    description,
  });
}
