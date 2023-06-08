import React from 'react';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';

import { isRightChain } from '../utils/isRightChain';
import { WalletOperationInfos } from '../constants';
import { OperationTypeContext } from '..';
import { DCButton } from '@/components/common/DCButton';
import { WarningInfo } from '@/components/common/WarningInfo';
import { useWalletSwitchNetWork } from '@/modules/wallet-connect/hooks/useWalletSwitchNetwork';

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
  const { switchNetwork } = useWalletSwitchNetWork();

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
