import React, { ReactElement, memo } from 'react';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { Text } from '@totejs/uikit';
import { smMedia } from '@/modules/responsive';
import { useDispatch } from 'react-redux';
import { setConnectWallet } from '@/store/slices/global';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/utils/constant';
import { useAccount } from 'wagmi';

interface ConnectWalletProps extends DCButtonProps {
  icon?: ReactElement;
  text?: string;
}

export const ConnectWallet = memo<Partial<ConnectWalletProps>>(function ConnectButton(props) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { isConnected } = useAccount();
  const { icon, text, ...restProps } = props;
  const onOpen = () => {
    // The window.trustwallet.request method is undefined when the app is loaded. So add a delay to avoid.
    setTimeout(() => {
      if (loginAccount && isConnected) {
        const originPathname = decodeURIComponent(router.query.originAsPath as string);
        return router.push(
          !!originPathname && originPathname !== 'undefined'
            ? originPathname
            : InternalRoutePaths.buckets,
        );
      };
      dispatch(setConnectWallet(true));
    }, 200)
  }

  return (
    <>
      <DCButton
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
            paddingX: 16
          }
        }}
      >
        {icon ? icon : ''}
        <Text marginLeft={icon ? '4px' : ''}>{text ? text : 'Connect Wallet'}</Text>
      </DCButton>
    </>
  );
});
