import { handleCommonError } from '@/modules/wallet-connect/error/handleCommonError';
import { SwitchNetworkErrorCodeMsgMap } from '@/modules/wallet-connect/error/error';

export interface SwitchNetworkArgs {
  [x: string]: any;
}

export type CustomSwitchNetworkErrorHandler = (
  err: Error,
  variables?: any,
  context?: unknown,
) => unknown;

export interface SwitchNetworkErrorHandlerParams {
  fn?: CustomSwitchNetworkErrorHandler;
}

export function switchNetworkErrorHandler(params: SwitchNetworkErrorHandlerParams = {}) {
  const { fn } = params;

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
