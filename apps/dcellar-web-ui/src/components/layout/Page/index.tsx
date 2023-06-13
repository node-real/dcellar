import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Nav } from '@/components/layout/Nav';
import { IgnoreFooterPaths } from '@/constants/paths';
import { Flex } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function Page(props: React.PropsWithChildren) {
  const { children } = props;

  const router = useRouter();
  const { pathname } = router;

  const isShowFooter = useMemo(
    () => !IgnoreFooterPaths.some((item) => router.pathname.includes(item)),
    [router.pathname],
  );

  if (pathname === '/') {
    return (
      <>
        {children}
        {isShowFooter && <Footer />}
      </>
    );
  }

  return (
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
        <Header />
      </Flex>
      <Nav />
    </Flex>
  );
}
