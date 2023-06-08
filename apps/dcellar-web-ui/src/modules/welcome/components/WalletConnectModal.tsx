import { DCModal, DCModalProps } from '@/components/common/DCModal';
import { TRUST_WALLET_DOWNLOAD_URL } from '@/constants/links';
import { WalletItem } from '@/modules/welcome/components/WalletItem';
import { Link, ModalBody, ModalCloseButton, ModalFooter, ModalHeader } from '@totejs/uikit';
import MetaMaskIcon from '@/public/images/icons/metamask.svg';
import TrustWalletIcon from '@/public/images/icons/trust_wallet.svg';
import { GAClick } from '@/components/common/GATracker';
import { useWallet } from '@/context/WalletConnectContext/hooks/useWallet';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useEffect } from 'react';

export interface WalletConnectModalProps extends DCModalProps {
  onSuccess: (address?: string) => void;
}

export function WalletConnectModal(props: WalletConnectModalProps) {
  const { isOpen, onClose, onSuccess } = props;

  const { isLoading, connectors, connector, onChangeConnector, disconnect } = useWallet({
    chainId: GREENFIELD_CHAIN_ID,
    onSuccess,
  });

  useEffect(() => {
    if (isOpen) {
      disconnect();
    }
  }, [disconnect, isOpen]);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w={484}
      gaShowName="dc.walletconnect.modal.0.show"
      gaClickCloseName="dc.walletconnect.modal.close.click"
    >
      <ModalCloseButton />
      <ModalHeader>Connect a Wallet</ModalHeader>
      <ModalBody mt={34}>
        {connectors?.map((item) => {
          const options = getOptionsByWalletName(item.name);
          const isActive = isLoading && connector?.name === item.name;

          return (
            <GAClick name={options?.gaClickName} key={item.name}>
              <WalletItem
                icon={options?.icon}
                name={item.name}
                isActive={isActive}
                isDisabled={isLoading}
                onClick={() => onChangeConnector(item)}
              />
            </GAClick>
          );
        })}
      </ModalBody>

      <ModalFooter
        mt={40}
        fontSize={14}
        fontWeight={400}
        lineHeight="17px"
        color="readable.tertiary"
        gap={4}
      >
        Don’t have a wallet?
        <Link
          href={TRUST_WALLET_DOWNLOAD_URL}
          isExternal
          color="inherit"
          textDecoration="underline"
        >
          Get one here!
        </Link>
      </ModalFooter>
    </DCModal>
  );
}

function getOptionsByWalletName(walletName: string) {
  switch (walletName) {
    case 'MetaMask':
      return {
        icon: <MetaMaskIcon />,
        gaClickName: 'dc.walletconnect.modal.metamak.click',
      };
    case 'Trust Wallet':
      return {
        icon: <TrustWalletIcon />,
        gaClickName: 'dc.walletconnect.modal.trustwallet.click',
      };
    default:
      return null;
  }
}
