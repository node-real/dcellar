import { toast } from '@totejs/uikit';
import React from 'react';
import { useMemo } from 'react';
import {
  AddChainError,
  ConnectorNotFoundError,
  SwitchChainError,
  useNetwork,
  UserRejectedRequestError,
  useSwitchNetwork,
} from 'wagmi';

import { isRightChain } from '../utils/isRightChain';
import { WalletOperationInfos } from '../constants';
import { OperationTypeContext } from '..';
import { REQUEST_PENDING_NUM, USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { DCButton } from '@/components/common/DCButton';
import { WarningInfo } from '@/components/common/WarningInfo';

type Props = {
  isSubmitting: boolean;
  disabled: boolean;
  isGasLoading: boolean;
  gaClickSubmitName?: string;
  gaClickSwitchName?: string;
};

export const WalletButton = ({
  isSubmitting,
  disabled,
  isGasLoading,
  gaClickSubmitName,
  gaClickSwitchName,
}: Props) => {
  const contextVals = React.useContext(OperationTypeContext);

  const curInfo = WalletOperationInfos[contextVals.type];
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    onError(data: any) {
      if (data instanceof Error) {
        if (data instanceof ConnectorNotFoundError || data instanceof UserRejectedRequestError) {
          return;
        }
        if (data instanceof AddChainError) {
          toast.info({
            description: `Oops, add network met error, please check it in wallet extension.`,
          });
          return;
        }
        if (data instanceof SwitchChainError) {
          toast.info({
            description: `Oops, switch network met error, please check it in wallet extension.`,
          });
          return;
        }
        toast.error({
          description: `Oops, switch network met error, please try again.`,
        });
        return;
      }
      const { code = '', message = '' } = data?.cause as any;
      if (code && parseInt(code) === USER_REJECT_STATUS_NUM) return;
      if (code && parseInt(code) === REQUEST_PENDING_NUM) {
        toast.info({
          description: `Oops, switch network action is pending, please confirm it in wallet extension that you are using.`,
        });
      } else {
        toast.error({
          description: `Oops, switch network met error, please try again.`,
        });
      }
      // eslint-disable-next-line no-console
      console.error(`Switch Network error, error code:${code}, message: ${message}`);
    },
  });

  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  const onSwitchChainClick = () => {
    switchNetwork?.(curInfo?.chainId);
  };

  if (!isRight) {
    return (
      <>
        <DCButton
          as="div"
          variant="dcWarning"
          width={'100%'}
          cursor={'pointer'}
          textTransform="-moz-initial"
          onClick={() => onSwitchChainClick()}
          gaClickName={gaClickSwitchName}
        >
          {curInfo?.changeChainText}
        </DCButton>
        <WarningInfo content={curInfo?.warning} />
      </>
    );
  }

  return (
    <DCButton
      variant="dcPrimary"
      width={'100%'}
      isLoading={isSubmitting || isGasLoading}
      disabled={disabled}
      type={'submit'}
      gaClickName={gaClickSubmitName}
    >
      {curInfo.text}
    </DCButton>
  );
};
