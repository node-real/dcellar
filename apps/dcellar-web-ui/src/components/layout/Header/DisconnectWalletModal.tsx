import { DCButton } from '@/components/common/DCButton';
import { DCModal } from '@/components/common/DCModal';
import { useLogin } from '@/hooks/useLogin';
import { useAppDispatch, useAppSelector } from '@/store';
import { setDisconnectWallet } from '@/store/slices/global';
import { ModalBody, ModalCloseButton, ModalFooter, ModalHeader } from '@totejs/uikit';

export const DisconnectWalletModal = () => {
  const dispatch = useAppDispatch();
  const { logout } = useLogin();
  const { disconnectWallet } = useAppSelector((state) => state.global);
  const onClose = () => {
    dispatch(setDisconnectWallet(false));
  };
  return (
    <DCModal isOpen={disconnectWallet} onClose={onClose} gaShowName="" gaClickCloseName="">
      <ModalHeader>Disconnect Wallet</ModalHeader>
      <ModalCloseButton />
      <ModalBody color={'readable.tertiary'} textAlign={'center'} fontSize={18}>
        Are you sure you want to disconnect wallet? This action may cause any uploading objects to
        fail.
      </ModalBody>
      <ModalFooter>
        <DCButton size={'lg'} variant="ghost" flex={1} onClick={onClose} gaClickName={''}>
          Cancel
        </DCButton>

        <DCButton size={'lg'} flex={1} onClick={() => logout(true)}>
          Disconnect
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
