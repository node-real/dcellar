import React, { memo, ReactElement, useEffect, useState } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { useRouter } from 'next/router';
import { useAccount, useDisconnect } from 'wagmi';
import { ssrLandingRoutes } from '@/pages/_app';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { checkOffChainDataAvailable, setLogin } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { useAppDispatch } from '@/store';
import { useModal } from '@totejs/walletkit';
import { InternalRoutePaths } from '@/constants/paths';

interface ConnectWalletProps extends DCButtonProps {
  icon?: ReactElement;
  text?: string;
}

// for multi connect button in one page
let eventTriggerTime = Date.now();

export const ConnectWallet = memo<Partial<ConnectWalletProps>>(function ConnectButton(props) {
  const { onOpen, onClose } = useModal();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { connector, address, isConnected } = useAccount();
  const { icon, text, ...restProps } = props;
  const [waitConnector, setWaitConnector] = useState(false);
  const [trustEvent, setTrustEvent] = useState(0);
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();
  const { disconnect } = useDisconnect();
  // const { chain } = useNetwork();
  //
  // const { switchNetwork } = useSwitchNetwork({});
  //
  // useEffect(() => {
  //   if (chain?.id !== GREENFIELD_CHAIN_ID && connector?.name === 'WalletConnect') {
  //     switchNetwork?.(GREENFIELD_CHAIN_ID);
  //   }
  // }, [chain?.id, connector, switchNetwork]);

  useAsyncEffect(async () => {
    if (trustEvent !== eventTriggerTime || isAuthPending || !address || !isConnected) return;

    const isAvailable = await dispatch(checkOffChainDataAvailable(address));

    if (!isAvailable) {
      const res = await onOffChainAuth(address);
      onClose();
      if (res.code !== 0) {
        disconnect();
        return;
      }
      dispatch(setLogin(address));
    } else {
      onClose();
      dispatch(setLogin(address));
    }

    // Only user trigger login at landing page that app needs redirect to the main page.
    if (!ssrLandingRoutes.some((item) => item === router.pathname)) {
      return;
    }

    // Redirect to the main page after user login manually.
    const originPathname = decodeURIComponent(router.query.originAsPath as string);
    router.push(
      !!originPathname && originPathname !== 'undefined'
        ? originPathname
        : InternalRoutePaths.dashboard,
    );
  }, [address, trustEvent, isAuthPending, router]);

  useEffect(() => {
    if (!connector || !address || !waitConnector) return;
    const originPathname = decodeURIComponent(router.query.originAsPath as string);

    router.push(
      !!originPathname && originPathname !== 'undefined'
        ? originPathname
        : InternalRoutePaths.dashboard,
    );
  }, [waitConnector, connector, address]);

  const onGetStart = () => {
    if (isAuthPending) return;
    if (!address) {
      eventTriggerTime = Date.now();
      setTrustEvent(eventTriggerTime);
      onOpen();
      return;
    }
    setWaitConnector(true);
  };

  return (
    <DCButton
      px={48}
      h={54}
      fontSize={18}
      lineHeight="22px"
      fontWeight={600}
      {...restProps}
      onClick={onGetStart}
      borderRadius={4}
      sx={{
        [smMedia]: {
          h: 33,
          fontWeight: 500,
          fontSize: 14,
          paddingX: 16,
        },
      }}
    >
      {icon ? icon : ''}
      <Text marginLeft={icon ? '4px' : ''}>{text ? text : 'Connect Wallet'}</Text>
    </DCButton>
  );
});
