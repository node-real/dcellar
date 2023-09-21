import React, { memo } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { WalletConnectModal } from '@/components/ConnectWallet/WalletConnectModal';
import { useDisclosure } from '@totejs/uikit';

interface ConnectWalletProps extends DCButtonProps {}

export const ConnectWallet = memo<ConnectWalletProps>(function ConnectButton(props) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <>
      <WalletConnectModal isOpen={isOpen} onClose={onClose} />
      <DCButton
        px={48}
        h={54}
        fontSize={18}
        lineHeight="22px"
        fontWeight={600}
        {...props}
        onClick={onOpen}
      >
        Connect Wallet
      </DCButton>
    </>
  );
});
