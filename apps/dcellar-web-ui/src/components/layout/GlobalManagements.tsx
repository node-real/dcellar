import { GAPageView } from '@/components/common/GATracker';
import { DisconnectWalletModal } from '@/components/layout/Header/DisconnectWalletModal';
import { GasObjects } from '@/components/layout/Header/GasObjects';
import { GlobalTasks } from '@/components/layout/Header/GlobalTasks';
import { ManageQuotaDrawer } from '@/components/layout/Header/ManageQuota';
import { PaymentAccounts } from '@/components/layout/Header/PaymentAccounts';
import { StoreFeeParams } from '@/components/layout/Header/StoreFeeParams';
import { BucketOperations } from '@/modules/bucket/components/BucketOperations';
import { ObjectOperations } from '@/modules/object/components/ObjectOperations';
import { StatusDetail } from '@/modules/object/components/StatusDetail';
import { useAppSelector } from '@/store';
import Head from 'next/head';
import { memo } from 'react';

interface GlobalManagementsProps {}

export const GlobalManagements = memo<GlobalManagementsProps>(function GlobalManagements() {
  const { allSps } = useAppSelector((root) => root.sp);

  return (
    <>
      <Head>
        {allSps.length > 0 &&
          allSps.map(({ endpoint }) => <link key={endpoint} rel="preconnect" href={endpoint} />)}
      </Head>
      <GAPageView />
      <StatusDetail />
      <ManageQuotaDrawer />
      <GlobalTasks />
      <GasObjects />
      <PaymentAccounts />
      <StoreFeeParams />
      <DisconnectWalletModal />
      {/* for global download confirm modal */}
      <ObjectOperations level={1} />
      <BucketOperations level={1} />
    </>
  );
});
