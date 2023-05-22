import React, { useEffect, useState } from 'react';
import {
  useAccount,
  useConnect,
  useSwitchNetwork,
  useDisconnect,
  useNetwork,
  ConnectorNotFoundError,
  UserRejectedRequestError,
  AddChainError,
  SwitchChainError,
} from 'wagmi';
import {
  Flex,
  Text,
  Image,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  toast,
  Box,
} from '@totejs/uikit';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { useRouter } from 'next/router';

import { useLogin } from '@/hooks/useLogin';
import { useIsMounted } from '@/hooks/useIsMounted';
import { assetPrefix, GREENFIELD_CHAIN_ID } from '@/base/env';
import { REQUEST_PENDING_NUM, USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { InternalRoutePaths } from '@/constants/links';
import { DCButton } from '../common/DCButton';
import { DCModal } from '@/components/common/DCModal';
import MetaMaskIcon from '@/public/images/icons/metamask.svg';
import TrustWalletIcon from '@/public/images/icons/trust_wallet.svg';
import { InjectedConnector } from 'wagmi/connectors/injected';
import {
  checkOffChainDataAvailable,
  getOffChainData,
} from '@/modules/off-chain-auth/utils';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/';
const TRUST_WALLET_DOWNLOAD_URL = 'https://trustwallet.com/browser-extension';
const Welcome = () => {
  const isMounted = useIsMounted();
  const loginData = useLogin();
  const { loginState, loginDispatch } = loginData;
  const { address } = loginState;
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [currentAddress, setCurrentAddress] = useState(address);
  const { chain } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [switchNetworkDone, setSwitchNetworkDone] = useState(false);
  const [currentConnector, setCurrentConnector] = useState<any>();
  const router = useRouter();
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();
  const network = useSwitchNetwork({
    throwForSwitchChainNotSupported: true,
    onSuccess() {
      setSwitchNetworkDone(true);
      setLoading(false);
    },
    onError(data: any) {
      if (data instanceof Error) {
        if (
          data instanceof ConnectorNotFoundError ||
          data instanceof UserRejectedRequestError
          // no need to show any toast, but need to disconnect to ensure user will reconnect to prevent these errors
        ) {
        } else if (data instanceof SwitchChainError) {
          const { code = '' } = data?.cause as any;
          if (code && parseInt(code) === REQUEST_PENDING_NUM) {
            return;
          }
          toast.info({
            description: `Oops, switch network met error, please check it in wallet extension.`,
          });
          return;
        } else if (data instanceof AddChainError) {
          // no need to show any toast and disconnect
          return;
        } else {
          toast.error({
            description: `Oops, switch network met error, please try again.`,
          });
        }
        setTimeout(() => {
          disconnect();
        }, 200);
        setLoading(false);
        return;
      }
      const { code = '', message = '' } = data?.cause as any;
      if (code && parseInt(code) === USER_REJECT_STATUS_NUM) return;
      if (code && parseInt(code) === REQUEST_PENDING_NUM) {
        toast.info({
          description: `Oops, switch network action is pending, please confirm it in wallet extension that you are using.`,
        });
      } else {
        disconnect();
        setLoading(false);
        toast.error({
          description: `Oops, switch network met error, please try again.`,
        });
      }
      // eslint-disable-next-line no-console
      console.error(`Switch Network error, error code:${code}, message: ${message}`);
    },
  });
  const { switchNetwork } = network;
  const { connect, connectors } = useConnect({
    onSuccess(data) {
      setLoading(false);
      const { account: accountAddress } = data;
      setCurrentAddress(accountAddress);
    },
    onError(data) {
      setLoading(false);
      // console.error('use connect error', data.cause);
      if (data instanceof ConnectorNotFoundError) {
        if (currentConnector instanceof MetaMaskConnector) {
          toast.warning({
            description: `Metamask not installed. Please install and reconnect.`,
            duration: 5000,
          });
          window.open(METAMASK_DOWNLOAD_URL, '_blank');
          return;
        }
        if (currentConnector instanceof InjectedConnector) {
          if (currentConnector.name === 'Trust Wallet') {
            toast.warning({
              description: `Trust wallet not installed. Please install and reconnect.`,
              duration: 5000,
            });
            window.open(TRUST_WALLET_DOWNLOAD_URL, '_blank');
            return;
          }
        }
        toast.warning({
          description: `Wallet not installed. Please install and reconnect.`,
          duration: 5000,
        });
      } else {
        const { code = '', message = '' } = data?.cause as any;
        if (code && parseInt(code) === USER_REJECT_STATUS_NUM) return;
        if (code && parseInt(code) === REQUEST_PENDING_NUM) {
          toast.info({
            description: `Oops, connect wallet action is pending, please confirm it in wallet extension that you are using.`,
          });
        } else {
          toast.error({
            description: `Oops, connect wallet met error, please try again.`,
          });
        }
        // eslint-disable-next-line no-console
        console.error(`Connect wallet error, error code:${code}, message: ${message}`);
      }
    },
  });
  useEffect(() => {
    Array.from(
      new Set(Object.values(InternalRoutePaths).map((relativePath) => relativePath.split('?')[0])),
    ).forEach((path: string) => {
      router.prefetch(path);
    });
  }, [router]);

  useEffect(() => {
    if (isConnected) {
      onClose();
      if (chain?.id !== GREENFIELD_CHAIN_ID) {
        setLoading(true);
        try {
          switchNetwork?.(GREENFIELD_CHAIN_ID);
        } catch (error: any) {
          toast.error({
            description: `Oops, switch network met error, please try again.`,
          });
          // eslint-disable-next-line no-console
          console.error(`Switch Network error`, error);
        }
      } else {
        if (currentAddress) {
          const offChainData = getOffChainData(currentAddress);
          const isAvailable = checkOffChainDataAvailable(offChainData);
          if (!isAvailable) {
            onOffChainAuth(currentAddress).then((res: any) => {
              if (res.code === 0) {
                loginDispatch({
                  type: 'LOGIN',
                  payload: {
                    address: currentAddress,
                  },
                });
              }
            });
          } else {
            loginDispatch({
              type: 'LOGIN',
              payload: {
                address: currentAddress,
              },
            });
          }
        }
      }
    } else {
      if (switchNetworkDone) {
        connect({ connector: currentConnector });
      }
    }
  }, [isConnected, chain, currentAddress, switchNetworkDone]);

  const renderConnectWalletButton = () => {
    if (isConnected)
      return (
        <DCButton
          variant="dcPrimary"
          mt="128px"
          minH="48px"
          minW={229}
          fontSize={18}
          onClick={() => {
            disconnect();
            onToggle();
          }}
          isLoading={loading || isAuthPending}
        >
          Connect Wallet
        </DCButton>
      );
    return (
      <DCButton
        variant="dcPrimary"
        mt="128px"
        minW={229}
        minH="48px"
        fontSize={18}
        onClick={onToggle}
        isLoading={loading}
        gaClickName="dc.welcome.main.connect_wa.click"
      >
        Connect Wallet
      </DCButton>
    );
  };
  const renderWalletIcon = (name: string) => {
    switch (name) {
      case 'MetaMask':
        return <MetaMaskIcon />;
      case 'Trust Wallet':
        return <TrustWalletIcon />;
      default:
        return <></>;
    }
  };
  const renderWalletButtons = (connectors: any) => {
    if (isConnected) return;
    return connectors.map((connector: any, index: number) => {
      const { name } = connector;
      const gaClickName = getGAOptions(name);
      return (
        <DCButton
          variant="second"
          mb="16px"
          height="68px"
          w="100%"
          key={`${name}-${index}`}
          isLoading={loading}
          border="1px solid transparent"
          _hover={{ border: '1px solid readable.brand6' }}
          position="relative"
          onClick={() => {
            setLoading(true);
            setCurrentConnector(connector);
            // set some delay time to determine connector is set by setCurrentConnector
            setTimeout(() => {
              connect({ connector });
            }, 200);
          }}
          gaClickName={gaClickName}
        >
          <Box position="absolute" left="16px" top="8px">
            {renderWalletIcon(name)}
          </Box>
          <Box width="100%" justifyContent="center" fontWeight={600} fontSize="18px">
            {name}
          </Box>
        </DCButton>
      );
    });
  };
  // Need to confirm it is client side ready
  // And, if it has logged in, don't show anything (maybe change later)
  if (!isMounted || address) return null;
  return (
    <>
      <DCModal
        isOpen={isOpen}
        onClose={onClose}
        w="484px"
        gaShowName="dc.walletconnect.modal.0.show"
        gaClickCloseName="dc.walletconnect.modal.close.click"
      >
        <ModalCloseButton />
        <ModalHeader marginTop={'16px'}>Connect a Wallet</ModalHeader>
        <ModalBody marginTop={'32px'}>
          <Flex w="100%" flexDirection="column" alignItems="center">
            {renderWalletButtons(connectors)}
          </Flex>
        </ModalBody>
      </DCModal>
      <Flex
        minH={'calc(100vh - 64px)'}
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Image
          src={`${assetPrefix}/images/icons/storage_icon.svg`}
          alt="Storage app icon"
          width={100}
          height={100}
        />
        <Text
          as="h1"
          fontSize="28px"
          mt="66px"
          lineHeight="34px"
          maxW={680}
          color="readable.normal"
          textAlign="center"
          fontWeight={700}
        >
          Start your journey of BNB Greenfield decentralized data network with DCellar Now.🥳
        </Text>
        {renderConnectWalletButton()}
      </Flex>
    </>
  );
};

export default Welcome;

function getGAOptions(name: string) {
  const options: Record<string, string> = {
    MetaMask: 'dc.walletconnect.modal.metamak.click',
    'Trust Wallet': 'dc.walletconnect.modal.trustwallet.click',
  };

  return options[name];
}
