import React, { ReactElement, memo } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { WalletConnectModal } from '@/components/ConnectWallet/WalletConnectModal';
import { useDisclosure, Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';

type ConnectWalletProps = DCButtonProps & {
  icon?: ReactElement;
  text?: string;
};
export const ConnectWallet = memo<Partial<ConnectWalletProps>>(function ConnectButton(props) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { icon, text, ...restProps } = props;
  return (
    <>
      <WalletConnectModal isOpen={isOpen} onClose={onClose} />
      <DCButton
        variant="dcPrimary"
        px={48}
        h={54}
        fontSize={18}
        lineHeight="22px"
        fontWeight={600}
        {...restProps}
        onClick={onOpen}
        borderRadius={4}
        sx={{
          [smMedia]: {
            h: 33,
            fontWeight: 500,
            fontSize: 14,
            paddingX: 16
          }
        }}
      >
        {icon ? icon : ''}
        <Text marginLeft={icon ? '4px' : ''}>{text ? text : 'Connect Wallet'}</Text>
      </DCButton>
    </>
  );
});
