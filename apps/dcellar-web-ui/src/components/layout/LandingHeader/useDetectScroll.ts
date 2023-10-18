import { useEffect, useState } from 'react';

export const useDetectScroll = () => {
  const [hasScroll, setHasScroll] = useState(false);

  useEffect(() => {
    const isScroll = !!document.documentElement.scrollTop;
    isScroll !== hasScroll && setHasScroll(isScroll);
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateScrollStatus = () => {
      const isScroll = !!document.documentElement.scrollTop;
      isScroll !== hasScroll && setHasScroll(isScroll);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollStatus);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [hasScroll]);

  return hasScroll;
};
