import React from 'react';
import { Flex, ModalBody, ModalFooter, Text } from '@totejs/uikit';
import { useDisconnect } from 'wagmi';

import CreateFailedIcon from '@/public/images/common/wrong-network.svg';
import { POPPINS_FONT } from '@/modules/wallet/constants';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { DCModal } from '../common/DCModal';
import { DCButton } from '../common/DCButton';
import { useWalletSwitchNetWork } from '@/context/WalletConnectContext';

export const WrongNetworkModal = ({ isOpen, onClose }: any) => {
  const { disconnect } = useDisconnect({
    onSuccess() {
      onClose();
    },
  });
  const { switchNetwork } = useWalletSwitchNetWork({
    onSuccess() {
      onClose();
    },
  });

  return (
    <DCModal isOpen={isOpen} onClose={() => {}} gaShowName="dc.wrongnet.gf_modal.0.show">
      <ModalBody textAlign={'center'} mt={0}>
        <Flex justifyContent={'center'}>
          <CreateFailedIcon />
        </Flex>
        <Text
          fontSize={'24px'}
          fontWeight={600}
          fontFamily={POPPINS_FONT}
          lineHeight="150%"
          marginY={'16px'}
        >
          Wrong Network
        </Text>
        <Text color="#76808F" fontSize={'18px'} fontWeight="400" lineHeight={'22px'}>
          You are on the wrong network. Switch your wallet to BNB Greenfield first.
        </Text>
      </ModalBody>
      <ModalFooter flexDirection={'column'} mt={24} gap={24}>
        <DCButton
          gaClickName="dc.wrongnet.gf_modal.swithtogf.click"
          variant="dcPrimary"
          width={'100%'}
          onClick={() => {
            switchNetwork && switchNetwork(GREENFIELD_CHAIN_ID);
          }}
        >
          Switch to BNB Greenfield
        </DCButton>
        <DCButton
          gaClickName="dc.wrongnet.gf_modal.disconnect.click"
          variant="dcGhost"
          width={'100%'}
          height="48px"
          onClick={() => {
            disconnect();
            onClose();
          }}
        >
          Disconnect Wallet
        </DCButton>
      </ModalFooter>
    </DCModal>
  );
};
