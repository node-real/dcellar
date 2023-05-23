import { createContext, useState } from 'react';
import { useAccount } from 'wagmi';
import { Image, ModalBody, Text, toast, useDisclosure } from '@totejs/uikit';

import { GREENFIELD_CHAIN_ID, assetPrefix } from '@/base/env';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { TSignAndUploadKeyOption, signAndUploadKey } from '@bnb-chain/greenfield-storage-js-sdk';
import { setOffChainData } from '@/modules/off-chain-auth/utils';
import { useSPs } from '@/hooks/useSPs';
import { useLogin } from '@/hooks/useLogin';
import { getDomain } from '@/utils/getDomain';

// const EXPIRE_TIME = 5 * 24 * 60 * 60 * 1000;
// TODO fix me, this is for test
const EXPIRATION_MS = 1 * 60 * 1000;
export const OffChainAuthContext = createContext<any>({});
export const OffChainAuthProvider: React.FC<any> = ({ children }) => {
  const [isAuthPending, setIsAuthPending] = useState(false);
  const {
    loginState: { address },
  } = useLogin();
  const { sps } = useSPs();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { connector } = useAccount();

  const onOffChainAuth = async (address: string) => {
    setIsAuthPending(true);
    try {
      const provider = await connector?.getProvider();
      const domain = getDomain();
      const pruneSps = sps.map((item: any) => ({
        address: item.operatorAddress,
        name: item.description.moniker,
        endpoint: item.endpoint,
      }));
      const params: TSignAndUploadKeyOption = {
        address,
        chainId: GREENFIELD_CHAIN_ID,
        sps: pruneSps,
        domain,
        expirationMs: EXPIRATION_MS,
      };
      const offChainData = await signAndUploadKey(params, provider);
      setOffChainData({ address, chainId: GREENFIELD_CHAIN_ID, offChainData });

      setIsAuthPending(false);
      onClose();

      return {code: 0, message: 'success'};
    } catch (e: any) {
      console.log('gen offChain data error', e);
      const { message } = e;
      message && toast.error({ description: `${message}`, duration: 3000 });
      setIsAuthPending(false);
      onClose();

      return {code: -1, error: e};
    }
  };

  return (
    <OffChainAuthContext.Provider
      value={{
        isAuthPending,
        onOffChainAuth,
        closeAuthModal: onClose,
        setOpenAuthModal: onOpen,
      }}
    >
      {children}
      <DCModal isOpen={isOpen} overlayProps={{
        zIndex: 1}} onClose={() => { }} gaShowName="dc.off_chain_auth.auth_modal.0.show">
        <ModalBody marginTop={'24px'} textAlign={'center'}>
          <Image
            alt="failed icon"
            src={`${assetPrefix}/images/icons/failed.svg`}
            margin={'0 auto 16px'}
          />
          <Text fontSize={'24px'} lineHeight={'150%'} fontWeight={600} marginBottom={'16px'}>
            Authentication Expired
          </Text>
          <Text fontSize={'18px'} lineHeight={'22px'} fontWeight={400} color={'readable.tertiary'}>
            Please connect your wallet to authenticate again to continue.
          </Text>
          <DCButton
            width={'100%'}
            marginTop={'24px'}
            marginBottom={'24px'}
            variant="dcPrimary"
            isLoading={isAuthPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOffChainAuth(address)
            }
            }
          >
            Authenticate Now
          </DCButton>
        </ModalBody>
      </DCModal>
    </OffChainAuthContext.Provider>
  );
};
