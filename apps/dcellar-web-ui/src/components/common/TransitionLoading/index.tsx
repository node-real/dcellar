import { Flex } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import LoadingIcon from '@/public/images/icons/loading.svg';

export const TransitionLoading = ({ children }: any) => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const handleStart = useCallback(
    (url: string) => url !== router.asPath && setLoading(true),
    [router.asPath],
  );
  const handleComplete = useCallback(
    (url: string) => url === router.asPath && setLoading(false),
    [router.asPath],
  );

  useEffect(() => {
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  });

  return loading ? (
    <Flex
      height="100vh"
      margin={'65px 0 0 269px'}
      alignItems="center"
      color="readable.brand6"
      justifyContent={'center'}
    >
      <LoadingIcon />
    </Flex>
  ) : (
    children
  );
};
