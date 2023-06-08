import { InternalRoutePaths } from '@/constants/paths';
import { LoginState } from '@/context/LoginContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function useLoginGuard(loginState: LoginState) {
  const { address } = loginState;

  const router = useRouter();
  const { pathname, asPath } = router;

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!address) {
      if (pathname.length > 0 && pathname !== '/') {
        let finalQuery = {} as any;
        finalQuery['originAsPath'] = encodeURIComponent(asPath);
        router.push({ pathname: '/', query: finalQuery }, undefined, { shallow: true });
      } else {
        setIsReady(true);
      }
    } else {
      if (router?.query?.originAsPath && router?.query.originAsPath.length > 0) {
        const originPathname = decodeURIComponent(router.query.originAsPath as string);
        router.push(originPathname, undefined, { shallow: true });
      } else if (pathname && pathname === '/') {
        router.push(InternalRoutePaths.buckets, undefined, { shallow: true });
      } else {
        setIsReady(true);
      }
    }
  }, [address, asPath, pathname, router]);

  return {
    isReady,
  };
}
