import { InternalRoutePaths } from '@/constants/paths';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store';
import { ssrLandingRoutes } from '@/pages/_app';
import { useMount } from 'ahooks';

export function useLoginGuard(inline: boolean) {
  const { loginAccount: address } = useAppSelector((root) => root.persist);

  const router = useRouter();
  const { pathname, asPath } = router;

  const [mounted, setMounted] = useState(false);
  const [pass, setPass] = useState(inline);

  useMount(() => {
    setMounted(true)
  });

  useEffect(() => {
    if (!address) {
      if (inline) {
        setPass(true);
      } else if (pathname.length > 0 && pathname !== '/') {
        let finalQuery = {} as any;
        finalQuery['originAsPath'] = encodeURIComponent(asPath);
        router.replace({ pathname: '/', query: finalQuery }, undefined, { shallow: true });
      } else {
        setPass(true);
      }
    } else {
      if (ssrLandingRoutes.some(item => item === pathname)) {
        return setPass(true);
      }
      if (router?.query?.originAsPath && router?.query.originAsPath.length > 0) {
        const originPathname = decodeURIComponent(router.query.originAsPath as string);
        router.replace(originPathname, undefined, { shallow: true });
      } else if (pathname && pathname === '/') {
        router.replace(InternalRoutePaths.buckets, undefined, { shallow: true });
      } else {
        setPass(true);
      }
    }
  }, [address, asPath, pathname, router, inline]);

  return {
    pass: (!mounted && inline) || pass,
  };
}
