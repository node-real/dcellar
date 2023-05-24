import { Flex } from '@totejs/uikit';
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';

import { useLogin } from '@/hooks/useLogin';
import { Nav } from '@/components/layout/Nav';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useIsMounted } from '@/hooks/useIsMounted';
import { SEOHead } from './SEOHead';
import { InternalRoutePaths } from '@/constants/links';

const IgnoreFooterPaths = ['/buckets','/'];

export const LoginLayout = ({
  children,
  disconnect,
}: {
  children: React.ReactNode;
  disconnect: any;
}) => {
  const isMounted = useIsMounted();
  const loginData = useLogin();
  const { loginState } = loginData;
  const router = useRouter();
  const address = loginState?.address;
  const { pathname, asPath } = router;
  const isShowFooter = useMemo(
    () => !IgnoreFooterPaths.some((item) => router.pathname.includes(item)),
    [router.pathname],
  );
  if (!isMounted) return <></>;
  // If user hasn't logged in, no need to render the sidebar layout.
  if (!address) {
    // TODO abstract this logic to a hook
    // If user hasn't logged in, any url will redirect to homepage and save the pathname in "originPath" query field.
    if (pathname.length > 0 && pathname !== '/') {
      let finalQuery = {} as any;
      finalQuery['originAsPath'] = encodeURIComponent(asPath);
      router.push({ pathname: '/', query: finalQuery }, undefined, { shallow: true });
    } else {
      return (
        <>
          <SEOHead />
          {children}
          {isShowFooter && <Footer />}
        </>
      );
    }
  } else {
    // TODO abstract this logic to a util
    // redirect to origin url after login success
    if (router?.query?.originAsPath && router?.query.originAsPath.length > 0) {
      const originPathname = decodeURIComponent(router.query.originAsPath as string);
      router.push(originPathname, undefined, { shallow: true });
    } else if (pathname && pathname === '/') {
      // If it's empty pathname, like localhost:3000, then navigate to
      // "buckets" page
      router.push(InternalRoutePaths.buckets, undefined, { shallow: true });
    } else {
      return (
        <>
          <SEOHead />
          <Flex minH={'100vh'} minW={'1000px'} bg="bg.bottom" position={'relative'}>
            <Flex
              flex={1}
              flexDirection={'column'}
              justifyContent="space-between"
              position="relative"
              bg="bg.bottom"
            >
              <Flex
                flex={1}
                ml="269px"
                mt="64px"
                minW={'calc(100vw - 269px)'}
                flexDirection={'column'}
                bg="bg.bottom"
              >
                {children}
                {isShowFooter && <Footer />}
              </Flex>
              <Header disconnect={disconnect} />
            </Flex>
            <Nav />
          </Flex>
        </>
      );
    }
  }
};
