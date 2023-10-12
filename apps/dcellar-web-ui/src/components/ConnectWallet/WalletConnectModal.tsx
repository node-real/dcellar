import { DCModal } from '@/components/common/DCModal';
import { WalletItem } from '@/components/ConnectWallet/WalletItem';
import {
  Flex,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
} from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import { useWallet } from '@/context/WalletConnectContext/hooks/useWallet';
import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { useCallback, useEffect, useState } from 'react';
import { ConnectorNotFoundError } from 'wagmi';
import { useAppLogin } from '@/modules/welcome/hooks/useAppLogin';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/router';
import {
  InternalRoutePaths,
  METAMASK_DOWNLOAD_URL,
  TRUST_WALLET_DOWNLOAD_URL,
} from '@/utils/constant';
import { ssrLandingRoutes } from '@/pages/_app';
import { IconFont } from '@/components/IconFont';
import { setConnectWallet } from '@/store/slices/global';
import { useDispatch } from 'react-redux';
import { openLink } from '@/utils/bom';

export interface WalletConnectModalProps {}

export function WalletConnectModal() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [hasTrigger, setHasTrigger] = useState(false);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const [currentAddress, setCurrentAddress] = useState<string | undefined>('');
  const { connectWallet: isOpen } = useAppSelector((state) => state.global);
  const { isAuthPending } = useAppLogin(currentAddress);

  const onClose = useCallback(() => {
    dispatch(setConnectWallet(false));
  }, [dispatch]);

  const onSuccess = useCallback((address?: string) => {
    setCurrentAddress(address);
  }, []);

  useEffect(() => {
    if (hasTrigger && !isAuthPending && !!address) {
      onClose();
      // Only user trigger login at landing page that app needs redirect to the main page.
      if (!ssrLandingRoutes.some((item) => item === router.pathname)) {
        return;
      }
      // Redirect to the main page after user login manually.
      const originPathname = decodeURIComponent(router.query.originAsPath as string);
      setTimeout(
        () =>
          router.push(
            !!originPathname && originPathname !== 'undefined'
              ? originPathname
              : InternalRoutePaths.buckets,
          ),
        100,
      );
    }
  }, [address, hasTrigger, isAuthPending, isOpen, onClose, router]);

  const onConnectError = useCallback((err: Error, args: any) => {
    if (err instanceof ConnectorNotFoundError) {
      const { connector } = args;
      const link = connector.id === 'trust' ? TRUST_WALLET_DOWNLOAD_URL : METAMASK_DOWNLOAD_URL;
      openLink(link);
    }
  }, []);

  const {
    isLoading: isWalletConnecting,
    connectors,
    connector,
    onChangeConnector,
    disconnect,
  } = useWallet({
    chainId: GREENFIELD_CHAIN_ID,
    onSuccess,
    onConnectError,
  });

  const isLoading = isWalletConnecting || isAuthPending;

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
      <ModalHeader flexDirection={'column'} alignItems={'center'} gap={8}>
        <Text>Connect a Wallet</Text>
        <Flex fontSize={14} fontWeight={400} color={'readable.tertiary'}>
          By connecting your wallet, you agree to our&nbsp;
          <Link
            href={InternalRoutePaths.terms}
            isExternal
            color="inherit"
            alignItems={'center'}
            gap={8}
            _hover={{
              textDecoration: 'underline',
              color: 'brand.brand6'
            }}
          >
            Terms of Use
          </Link>
          .
        </Flex>
      </ModalHeader>

      <ModalBody mt={32}>
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
                onClick={() => {
                  setHasTrigger(true);
                  !address && onChangeConnector(item);
                }}
              />
            </GAClick>
          );
        })}
      </ModalBody>

      <ModalFooter
        mt={16}
        fontSize={14}
        fontWeight={600}
        lineHeight="17px"
        color="readable.tertiary"
      >
        <Link
          href={TRUST_WALLET_DOWNLOAD_URL}
          isExternal
          color="inherit"
          display={'flex'}
          alignItems={'center'}
          gap={8}
        >
          <IconFont type="wallet" w={24} />I don't have a wallet.
        </Link>
      </ModalFooter>
    </DCModal>
  );
}

function getOptionsByWalletName(walletName: string) {
  switch (walletName) {
    case 'MetaMask':
      return {
        icon: <IconFont w={52} type={'metamask'} />,
        gaClickName: 'dc.walletconnect.modal.metamak.click',
      };
    case 'Trust Wallet':
      return {
        icon: <IconFont w={52} type={'trustwallet'} />,
        gaClickName: 'dc.walletconnect.modal.trustwallet.click',
      };
    default:
      return null;
  }
}
