import { createContext, useCallback, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ModalBody, Text, toast, useDisclosure } from '@totejs/uikit';

import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { IGenOffChainAuthKeyPairAndUpload } from '@bnb-chain/greenfield-js-sdk';
import { isEmpty } from 'lodash-es';
import { useAppDispatch, useAppSelector } from '@/store';
import { SpItem } from '@/store/slices/sp';
import { setupOffchain } from '@/store/slices/persist';
import { setupBucketQuota } from '@/store/slices/bucket';
import { useUpdateEffect } from 'ahooks';
import { setAuthModalOpen } from '@/store/slices/global';
import { getDomain } from '@/utils/bom';
import { getClient } from '@/facade';
import { IconFont } from '@/components/IconFont';
import * as Sentry from '@sentry/nextjs';

const EXPIRATION_MS = 5 * 24 * 60 * 60 * 1000;
export const OffChainAuthContext = createContext<any>({});

export type AuthPostAction = {
  action: string;
  params?: Record<string, string>;
};

export const OffChainAuthProvider: React.FC<any> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { spInfo, allSps } = useAppSelector((root) => root.sp);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const authSps = useRef<SpItem[]>([]);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { connector } = useAccount();
  const [postAction, setPostAction] = useState({} as AuthPostAction);
  const { authModalOpen } = useAppSelector((root) => root.global);

  useUpdateEffect(() => {
    if (!authModalOpen[0]) return;
    setPostAction(authModalOpen[1]);
    onOpen();
  }, [authModalOpen]);

  // For selected sps auth
  const setOpenAuthModal = (spAddress?: string[] | null, action?: AuthPostAction) => {
    setPostAction(action || ({} as AuthPostAction));
    if (spAddress) {
      authSps.current = spAddress.map((a) => spInfo[a]);
    }
    onOpen();
  };

  const onOffChainAuth = useCallback(
    async (address: string) => {
      setIsAuthPending(true);
      const provider = await connector?.getProvider();
      try {
        const domain = getDomain();

        // If no sps selected, use all sps for welcome auth
        const pruneSps = (isEmpty(authSps.current) ? allSps : authSps.current).map((item: any) => ({
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
        if (postAction.action) {
          switch (postAction.action) {
            case 'quota':
              dispatch(setupBucketQuota(postAction.params!['bucketName']));
              break;
          }
        }
        return { code: 0, message: 'success' };
      } catch (e: any) {
        console.log('gen offChain data error', e);
        const { message } = e;
        console.error(provider);
        Sentry.withScope((scope) => {
          scope.setTag('Component', 'OffChainAuthContext');
          Sentry.captureMessage(JSON.stringify(e));
        });
        message && toast.error({ description: `${message}`, duration: 3000 });
        setIsAuthPending(false);
        onClose();

        return { code: -1, error: e };
      } finally {
        dispatch(setAuthModalOpen([false, {} as AuthPostAction]));
      }
    },
    [connector, allSps, dispatch, onClose, postAction],
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
      <DCModal isOpen={isOpen} onClose={() => {}} gaShowName="dc.off_chain_auth.auth_modal.0.show">
        <ModalBody mt={0} textAlign={'center'}>
          <IconFont type={'error-auth'} w={120} margin={'0 auto 16px'} />
          <Text fontSize={'24px'} lineHeight={'150%'} fontWeight={600} marginBottom={'16px'}>
            Authentication Expired
          </Text>
          <Text fontSize={'18px'} lineHeight={'22px'} fontWeight={400} color={'readable.tertiary'}>
            Please connect your wallet to authenticate again to continue.
          </Text>
          <DCButton
            size="lg"
            width={'100%'}
            marginTop={'24px'}
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
