import { GAPageView } from '@/components/common/GATracker';
import { BucketOperations } from '@/modules/bucket/components/BucketOperations';
import { ObjectOperations } from '@/modules/object/components/ObjectOperations';
import { useAppSelector } from '@/store';
import Head from 'next/head';
import { memo } from 'react';
import { StoreFeeParamsLoader } from './StoreFeeParamsLoader';
import { AccountsDataLoader } from './AccountsDataLoader';
import { DisconnectWalletModal } from './DisconnectWalletModal';
import { GasFeesConfigLoader } from './GasFeesConfigLoader';
import { GlobalObjectUploadManager } from './GlobalObjectUploadManager';
import { BucketQuotaDrawer } from './BucketQuotaManager';
import { SignatureProcessModal } from './SignatureProcessModal';

interface GlobalManagementsProps {}

export const GlobalManagements = memo<GlobalManagementsProps>(function GlobalManagements() {
  const allSpList = useAppSelector((root) => root.sp.allSpList);

  return (
    <>
      <Head>
        {allSpList.length > 0 &&
          allSpList.map(({ endpoint }) => <link key={endpoint} rel="preconnect" href={endpoint} />)}
      </Head>
      <GAPageView />
      <SignatureProcessModal />
      <BucketQuotaDrawer />
      <GlobalObjectUploadManager />
      <GasFeesConfigLoader />
      <AccountsDataLoader />
      <StoreFeeParamsLoader />
      <DisconnectWalletModal />
      {/* for global download confirm modal */}
      <ObjectOperations level={1} />
      <BucketOperations level={1} />
    </>
  );
});
