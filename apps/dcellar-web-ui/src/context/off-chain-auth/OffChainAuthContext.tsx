import { ModalBody, Text, toast, useDisclosure } from '@node-real/uikit';
import { createContext, useCallback, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import * as flatted from 'flatted';

import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCModal } from '@/components/common/DCModal';
import { getClient } from '@/facade';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupBucketQuota } from '@/store/slices/bucket';
import { setAuthModalOpen } from '@/store/slices/global';
import { setupOffchain } from '@/store/slices/persist';
import { SpEntity } from '@/store/slices/sp';
import { getDomain } from '@/utils/bom';
import { parseWCMessage } from '@/utils/common';
import { IGenOffChainAuthKeyPairAndUpload } from '@bnb-chain/greenfield-js-sdk';
import * as Sentry from '@sentry/nextjs';
import { useUpdateEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';

const EXPIRATION_MS = 5 * 24 * 60 * 60 * 1000;
export const OffChainAuthContext = createContext<any>({});

export type AuthPostAction = {
  action: string;
  params?: Record<string, string>;
};

export const OffChainAuthProvider: React.FC<any> = ({ children }) => {
  const dispatch = useAppDispatch();
  const spRecords = useAppSelector((root) => root.sp.spRecords);
  const allSpList = useAppSelector((root) => root.sp.allSpList);
  const address = useAppSelector((root) => root.persist.loginAccount);
  const offchainAuthOpen = useAppSelector((root) => root.global.offchainAuthOpen);

  const [isAuthPending, setIsAuthPending] = useState(false);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { connector } = useAccount();
  const [postAction, setPostAction] = useState({} as AuthPostAction);
  const authSps = useRef<SpEntity[]>([]);

  // For selected sps auth
  const setOpenAuthModal = (spAddress?: string[] | null, action?: AuthPostAction) => {
    setPostAction(action || ({} as AuthPostAction));
    if (spAddress) {
      authSps.current = spAddress.map((a) => spRecords[a]);
    }
    onOpen();
  };

  const onOffChainAuth = useCallback(
    async (address: string) => {
      setIsAuthPending(true);
      const provider = await connector?.getProvider();
      try {
        const domain = getDomain();

        const pruneSps = (isEmpty(authSps.current) ? allSpList : authSps.current).map(
          (item: any) => ({
            address: item.operatorAddress,
            name: item.moniker,
            endpoint: item.endpoint,
          }),
        );

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
        console.error('gen offChain data error', e);
        const message = parseWCMessage(e?.message) ?? e.message;
        console.error(provider);
        Sentry.withScope((scope) => {
          scope.setTag('Component', 'OffChainAuthContext');
          Sentry.captureMessage(flatted.stringify(e));
        });
        message && toast.error({ description: `${message}`, duration: 3000 });
        setIsAuthPending(false);
        onClose();

        return { code: -1, error: e };
      } finally {
        dispatch(setAuthModalOpen([false, {} as AuthPostAction]));
      }
    },
    [connector, allSpList, dispatch, onClose, postAction],
  );

  useUpdateEffect(() => {
    if (!offchainAuthOpen[0]) return;
    setPostAction(offchainAuthOpen[1]);
    onOpen();
  }, [offchainAuthOpen]);

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
