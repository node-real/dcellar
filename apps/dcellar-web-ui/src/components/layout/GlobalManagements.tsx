import React, { memo } from 'react';
import { GAPageView } from '@/components/common/GATracker';
import { StatusDetail } from '@/modules/object/components/StatusDetail';
import { ManageQuotaDrawer } from '@/components/layout/Header/ManageQuota';
import { GlobalTasks } from '@/components/layout/Header/GlobalTasks';
import { GasObjects } from '@/components/layout/Header/GasObjects';
import { PaymentAccounts } from '@/components/layout/Header/PaymentAccounts';
import { StoreFeeParams } from '@/components/layout/Header/StoreFeeParams';
import { DisconnectWalletModal } from '@/components/layout/Header/DisconnectWalletModal';
import { ObjectOperations } from '@/modules/object/components/ObjectOperations';

interface GlobalManagementsProps {}

export const GlobalManagements = memo<GlobalManagementsProps>(function GlobalManagements() {
  return (
    <>
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
    </>
  );
});
