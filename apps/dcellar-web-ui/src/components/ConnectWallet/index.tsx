import React, { memo, ReactElement, useState } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/utils/constant';
import { useAccount, useDisconnect } from 'wagmi';
import { ssrLandingRoutes } from '@/pages/_app';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { checkOffChainDataAvailable, setLogin } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { useAppDispatch } from '@/store';
import { useModal } from '@totejs/walletkit';

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
  const { address, connector, isConnected } = useAccount();
  const { icon, text, ...restProps } = props;
  const [trustEvent, setTrustEvent] = useState(0);
  const { isAuthPending, onOffChainAuth } = useOffChainAuth();
  const { disconnect } = useDisconnect();

  const redirect = () => {
    router.push(
      !!router.query.originAsPath
        ? decodeURIComponent(router.query.originAsPath as string)
        : InternalRoutePaths.buckets,
    );
  };

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
    redirect();
  }, [address, trustEvent, isAuthPending, router]);

  // connector may be undefined when wallet throw '(index):7 Error in event handler: Error: write after end';

  const openModal = () => {
    eventTriggerTime = Date.now();
    setTrustEvent(eventTriggerTime);
    onOpen();
    return;
  };

  const onGetStart = () => {
    if (isAuthPending) return;
    if (!address) {
      return openModal();
    }
    setTimeout(() => (!connector ? openModal() : redirect()), 180);
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
