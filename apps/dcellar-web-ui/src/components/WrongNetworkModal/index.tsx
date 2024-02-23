import { Flex, ModalBody, ModalFooter, Text } from '@node-real/uikit';

import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { CHAIN_NAMES } from '@/constants/wallet';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useLogin } from '@/hooks/useLogin';
import { useAccount } from 'wagmi';
import { DCButton } from '../common/DCButton';
import { DCModal } from '../common/DCModal';

export const WrongNetworkModal = ({ isOpen, onClose }: any) => {
  const { logout } = useLogin();
  const { address, connector, isConnected } = useAccount();
  const { switchNetwork } = useWalletSwitchNetWork({
    onSuccess() {
      onClose();
    },
  });

  return (
    <DCModal isOpen={isOpen} onClose={() => {}} gaShowName="dc.wrongnet.gf_modal.0.show">
      <ModalBody textAlign={'center'} mt={0}>
        <Flex justifyContent={'center'}>
          <IconFont w={120} type={'switch-network'} />
        </Flex>
        <Text fontSize={'24px'} fontWeight={600} lineHeight="150%" marginY={'16px'}>
          Switch Network
        </Text>
        <Text color="#76808F" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
          To complete the action, you need to switch to {CHAIN_NAMES[GREENFIELD_CHAIN_ID]}.
        </Text>
      </ModalBody>
      <ModalFooter flexDirection={'column'} mt={24} gap={16}>
        <DCButton
          size="lg"
          gaClickName="dc.wrongnet.gf_modal.swithtogf.click"
          width={'100%'}
          onClick={() => {
            switchNetwork?.(GREENFIELD_CHAIN_ID);
          }}
        >
          Switch to {CHAIN_NAMES[GREENFIELD_CHAIN_ID]}
        </DCButton>
        <DCButton
          size={'lg'}
          gaClickName="dc.wrongnet.gf_modal.disconnect.click"
          variant="ghost"
          width={'100%'}
          onClick={() => {
            logout();
            onClose();
          }}
        >
          Disconnect Wallet
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
