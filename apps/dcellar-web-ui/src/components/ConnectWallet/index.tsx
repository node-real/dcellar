import React, { ReactElement, memo } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { WalletConnectModal } from '@/components/ConnectWallet/WalletConnectModal';
import { useDisclosure, Text } from '@totejs/uikit';

interface ConnectWalletProps extends DCButtonProps {
  icon?: ReactElement;
  text?: string;
}

export const ConnectWallet = memo<ConnectWalletProps>(function ConnectButton(props) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { icon, text, ...restProps } = props;
  return (
    <>
      <WalletConnectModal isOpen={isOpen} onClose={onClose} />
      <DCButton
        px={48}
        h={54}
        fontSize={18}
        lineHeight="22px"
        fontWeight={600}
        {...restProps}
        onClick={onOpen}
      >
        {icon ? icon : ''}
        <Text>{text ? text : 'Connect Wallet'}</Text>
      </DCButton>
    </>
  );
});
