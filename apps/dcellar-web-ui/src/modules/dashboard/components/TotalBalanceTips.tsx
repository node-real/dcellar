import { Tips } from '@/components/common/Tips';
import { memo } from 'react';

interface TotalBalanceTipsProps {}

const TipsText =
  'Total balance is calculated by adding the Owner Account bank balance, Owner Account static balance, and the balance of all Payment Accounts.';

export const TotalBalanceTips = memo<TotalBalanceTipsProps>(function TotalBalanceTips() {
  return <Tips width={280} placement={'top'} w={'fit-content'} tips={TipsText} />;
});
