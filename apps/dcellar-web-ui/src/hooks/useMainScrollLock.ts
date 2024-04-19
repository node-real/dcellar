import { useEffect } from 'react';

export const useMainScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    const main = document.getElementById('layout-main');
    if (!main) {
      return;
    }
    if (isOpen) {
      main.style.overflow = 'hidden';
    } else {
      main.style.overflow = 'auto';
    }

    return () => {
      main.style.overflow = 'auto';
    };
  }, [isOpen]);
};
