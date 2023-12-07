import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { InternalRoutePaths } from '@/constants/paths';

export function usePreloadPages() {
  const router = useRouter();

  useEffect(() => {
    const pages = Array.from(
      new Set(Object.values(InternalRoutePaths).map((relativePath) => relativePath.split('?')[0])),
    );

    pages.forEach((path) => {
      router.prefetch(path);
    });
  }, [router]);
}
