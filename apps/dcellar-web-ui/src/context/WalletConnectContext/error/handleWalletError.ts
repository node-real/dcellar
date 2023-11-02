import { ErrorMsgMap } from '@/context/WalletConnectContext/error/error';
import { toast } from '@totejs/uikit';
import { ConnectorNotFoundError } from 'wagmi';
import * as Sentry from '@sentry/nextjs';

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
  const message = err.cause?.message ?? err.message;
  const description = text || ErrorMsgMap[code] || message;

  Sentry.withScope((scope) => {
    scope.setTag('Component', 'handleWalletError');
    Sentry.captureMessage(JSON.stringify(err));
  });
  toast.error({
    description,
  });
}
