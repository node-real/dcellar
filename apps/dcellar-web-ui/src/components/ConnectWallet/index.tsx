import React, { memo, ReactElement, useEffect, useRef, useState } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/utils/constant';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectWalletButton } from '@totejs/connect-wallet';
import { ssrLandingRoutes } from '@/pages/_app';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { checkOffChainDataAvailable, setLogin } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { useAppDispatch } from '@/store';

interface ConnectWalletProps extends DCButtonProps {
  icon?: ReactElement;
  text?: string;
}

// for multi connect button in one page
let eventTriggerTime = Date.now();

export const ConnectWallet = memo<Partial<ConnectWalletProps>>(function ConnectButton(props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { connector, address, isConnected } = useAccount();
  const { icon, text, ...restProps } = props;
  const [waitConnector, setWaitConnector] = useState(false);
  const [trustEvent, setTrustEvent] = useState(0);
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();
  const buttonRef = useRef<HTMLButtonElement>();
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
      if (res.code !== 0) {
        disconnect();
        return;
      }
      dispatch(setLogin(address));
    } else {
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
        : InternalRoutePaths.buckets,
    );
  }, [address, trustEvent, isAuthPending, router]);

  useEffect(() => {
    if (!connector || !address || !waitConnector) return;
    const originPathname = decodeURIComponent(router.query.originAsPath as string);

    router.push(
      !!originPathname && originPathname !== 'undefined'
        ? originPathname
        : InternalRoutePaths.buckets,
    );
  }, [waitConnector, connector, address]);

  const onOpen = () => {
    if (isAuthPending || !buttonRef.current) return;
    if (!address) {
      eventTriggerTime = Date.now();
      setTrustEvent(eventTriggerTime);
      buttonRef.current.click();
      return;
    }
    setWaitConnector(true);
  };

  const buttonContent = (
    <>
      {icon ? icon : ''}
      <Text marginLeft={icon ? '4px' : ''}>{text ? text : 'Connect Wallet'}</Text>
    </>
  );

  return (
    <>
      <ConnectWalletButton ref={buttonRef} w={0} h={0} overflow="hidden" position={'absolute'} />
      <DCButton
        disabled={isAuthPending}
        px={48}
        h={54}
        fontSize={18}
        lineHeight="22px"
        fontWeight={600}
        {...restProps}
        onClick={onOpen}
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
        {buttonContent}
      </DCButton>
    </>
  );
});
