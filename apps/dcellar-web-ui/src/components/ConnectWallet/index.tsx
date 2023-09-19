import React, { memo } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { WalletConnectModal } from '@/components/ConnectWallet/WalletConnectModal';
import { useDisclosure } from '@totejs/uikit';

interface ConnectWalletProps extends DCButtonProps {
  text?: string;
}

export const ConnectWallet = memo<ConnectWalletProps>(function ConnectButton(props) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { text, ...restProps } = props;
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
        {text ? text : 'Connect Wallet'}
      </DCButton>
    </>
  );
});
