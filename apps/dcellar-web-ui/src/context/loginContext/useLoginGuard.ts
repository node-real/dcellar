import { InternalRoutePaths } from '@/constants/paths';
import { LoginState } from '@/context/loginContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function useLoginGuard(loginState: LoginState) {
  const { address } = loginState;

  const router = useRouter();
  const { pathname, asPath } = router;

  const [pass, setPass] = useState(false);

  useEffect(() => {
    if (!address) {
      if (pathname.length > 0 && pathname !== '/') {
        let finalQuery = {} as any;
        finalQuery['originAsPath'] = encodeURIComponent(asPath);
        router.replace({ pathname: '/', query: finalQuery }, undefined, { shallow: true });
      } else {
        setPass(true);
      }
    } else {
      if (router?.query?.originAsPath && router?.query.originAsPath.length > 0) {
        const originPathname = decodeURIComponent(router.query.originAsPath as string);
        router.replace(originPathname, undefined, { shallow: true });
      } else if (pathname && pathname === '/') {
        router.replace(InternalRoutePaths.buckets, undefined, { shallow: true });
      } else {
        setPass(true);
      }
    }
  }, [address, asPath, pathname, router]);

  return {
    pass,
  };
}
