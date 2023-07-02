import { createContext, useCallback, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Image, ModalBody, Text, toast, useDisclosure } from '@totejs/uikit';

import { GREENFIELD_CHAIN_ID, assetPrefix } from '@/base/env';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { getDomain } from '@/utils/getDomain';
import { IGenOffChainAuthKeyPairAndUpload } from '@bnb-chain/greenfield-chain-sdk';
import { getClient } from '@/base/client';
import { isEmpty } from 'lodash-es';
import { useAppDispatch, useAppSelector } from '@/store';
import { SpItem } from '@/store/slices/sp';
import { setupOffchain } from '@/store/slices/persist';

const EXPIRATION_MS = 5 * 24 * 60 * 60 * 1000;
export const OffChainAuthContext = createContext<any>({});

export const OffChainAuthProvider: React.FC<any> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { spInfo, sps } = useAppSelector((root) => root.sp);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const authSps = useRef<SpItem[]>([]);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { connector } = useAccount();

  // For selected sps auth
  const setOpenAuthModal = (spAddress?: string[]) => {
    if (spAddress) {
      authSps.current = spAddress.map((a) => spInfo[a]);
    }
    onOpen();
  };

  const onOffChainAuth = useCallback(
    async (address: string) => {
      setIsAuthPending(true);
      try {
        const provider = await connector?.getProvider();
        const domain = getDomain();

        // If no sps selected, use all sps for welcome auth
        const pruneSps = (isEmpty(authSps.current) ? sps : authSps.current).map((item: any) => ({
          address: item.operatorAddress,
          name: item.moniker,
          endpoint: item.endpoint,
        }));

        const configParam: IGenOffChainAuthKeyPairAndUpload = {
          address,
          chainId: GREENFIELD_CHAIN_ID,
          sps: pruneSps,
          domain,
          expirationMs: EXPIRATION_MS,
        };

        const client = await getClient();
        const res = await client.offchainauth.genOffChainAuthKeyPairAndUpload(
          configParam,
          provider,
        );
        const { code, body: offChainData } = res;

        if (code !== 0 || isEmpty(offChainData)) {
          throw res;
        }
        dispatch(setupOffchain(address, offChainData, isEmpty(authSps.current)));
        setIsAuthPending(false);
        onClose();

        return { code: 0, message: 'success' };
      } catch (e: any) {
        console.log('gen offChain data error', e);
        const { message } = e;
        message && toast.error({ description: `${message}`, duration: 3000 });
        setIsAuthPending(false);
        onClose();

        return { code: -1, error: e };
      }
    },
    [connector, onClose, sps],
  );

  return (
    <OffChainAuthContext.Provider
      value={{
        isAuthPending,
        onOffChainAuth,
        closeAuthModal: onClose,
        setOpenAuthModal,
      }}
    >
      {children}
      <DCModal
        isOpen={isOpen}
        overlayProps={{
          zIndex: 1,
        }}
        onClose={() => {}}
        gaShowName="dc.off_chain_auth.auth_modal.0.show"
      >
        <ModalBody mt={0} textAlign={'center'}>
          <Image
            alt="auth failed icon"
            src={`${assetPrefix}/images/icons/error_auth.svg`}
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
            variant="dcPrimary"
            isLoading={isAuthPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOffChainAuth(address);
            }}
          >
            Authenticate Now
          </DCButton>
        </ModalBody>
      </DCModal>
    </OffChainAuthContext.Provider>
  );
};
