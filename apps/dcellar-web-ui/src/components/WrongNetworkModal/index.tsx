import React from 'react';
import { Flex, ModalBody, ModalFooter, Text } from '@totejs/uikit';

import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { DCModal } from '../common/DCModal';
import { DCButton } from '../common/DCButton';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';
import { useLogin } from '@/hooks/useLogin';
import { IconFont } from '@/components/IconFont';

export const WrongNetworkModal = ({ isOpen, onClose }: any) => {
  const { logout } = useLogin();

  const { switchNetwork } = useWalletSwitchNetWork({
    onSuccess() {
      onClose();
    },
  });

  return (
    <DCModal isOpen={isOpen} onClose={() => {}} gaShowName="dc.wrongnet.gf_modal.0.show">
      <ModalBody textAlign={'center'} mt={0}>
        <Flex justifyContent={'center'}>
          <IconFont w={120} type={'error-network'} />
        </Flex>
        <Text fontSize={'24px'} fontWeight={600} lineHeight="150%" marginY={'16px'}>
          Wrong Network
        </Text>
        <Text color="#76808F" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
          You are on the wrong network. Switch your wallet to BNB Greenfield first.
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
          Switch to BNB Greenfield
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
