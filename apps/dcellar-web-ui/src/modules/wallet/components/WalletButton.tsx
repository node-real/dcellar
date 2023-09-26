import React, { memo } from 'react';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { isRightChain } from '../utils/isRightChain';
import { WalletOperationInfos } from '../constants';
import { DCButton } from '@/components/common/DCButton';
import { WarningInfo } from '@/components/common/WarningInfo';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useAppSelector } from '@/store';

interface WalletButtonProps {
  isSubmitting: boolean;
  disabled: boolean;
  isGasLoading: boolean;
  gaClickSubmitName?: string;
  gaClickSwitchName?: string;
}

export const WalletButton = memo<WalletButtonProps>(function WalletButton({
  isSubmitting,
  disabled,
  isGasLoading,
  gaClickSubmitName,
  gaClickSwitchName,
}) {
  const { transType } = useAppSelector((root) => root.wallet);
  const curInfo = WalletOperationInfos[transType];
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
          size={'lg'}
          as="div"
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
      size={'lg'}
      width={'100%'}
      isLoading={isSubmitting || isGasLoading}
      disabled={disabled}
      type={'submit'}
      gaClickName={gaClickSubmitName}
    >
      {curInfo.text}
    </DCButton>
  );
});
