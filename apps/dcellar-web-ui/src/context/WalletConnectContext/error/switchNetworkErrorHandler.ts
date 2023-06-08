import { SwitchNetworkErrorCodeMsgMap } from '@/context/WalletConnectContext/error/error';
import { handleCommonError } from '@/context/WalletConnectContext/error/handleCommonError';

export interface SwitchNetworkArgs {
  [x: string]: any;
}

export type CustomSwitchNetworkErrorHandler = (
  err: Error,
  variables?: any,
  context?: unknown,
) => unknown;

export function switchNetworkErrorHandler(fn?: CustomSwitchNetworkErrorHandler) {
  const handleError = (err: any, variables: SwitchNetworkArgs, context: unknown) => {
    switch (true) {
      default:
        handleCommonError(
          err,
          SwitchNetworkErrorCodeMsgMap,
          `Oops, switch network met error, please try again.`,
        );
    }
  };

  return (err: Error, variables: SwitchNetworkArgs, context: unknown) => {
    handleError(err, variables, context);
    fn?.(err, variables, context);
  };
}
