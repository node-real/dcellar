import React, { useEffect } from 'react';
import { useNetwork } from 'wagmi';
import { useDisclosure } from '@totejs/uikit';
import { useRouter } from 'next/router';

import { isRightChain } from '@/modules/wallet/utils/isRightChain';
import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID } from '@/base/env';
import { WrongNetworkModal } from '@/components/WrongNetworkModal';

// protect: GNFD chain, GNFD & BSC chain and no protect.
const protectGNFDPaths = ['/buckets', '/buckets/[...path]', '/groups', '/accounts'];
const noProtectPaths = ['/', '/terms', '/pricing-calculator', '/tool-box'];

// TODO unify the wallet page protect
export const PageProtect: React.FC<any> = ({ children }) => {
  const { chain } = useNetwork();
  const { pathname } = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    if (!chain?.id) return;
    if (pathname === '/') return;
    const inProtectGNFDPath = protectGNFDPaths.some((path) => pathname === path);
    const isNoProtectGNFDPath = noProtectPaths.some((path) => pathname === path);
    const isGNFD = isRightChain(chain?.id, GREENFIELD_CHAIN_ID);
    const isDcellarChains = [GREENFIELD_CHAIN_ID, BSC_CHAIN_ID].includes(chain?.id);

    if (isNoProtectGNFDPath) {
      return onClose();
    } else if (inProtectGNFDPath) {
      isGNFD ? onClose() : onOpen();
    } else {
      isDcellarChains ? onClose() : onOpen();
    }
  }, [chain?.id, onClose, onOpen, pathname]);

  return (
    <>
      {children}
      <WrongNetworkModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};
