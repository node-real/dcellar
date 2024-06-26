import { Box, Tooltip } from '@node-real/uikit';
import { memo } from 'react';

import { AccountType } from '@/store/slices/accounts';
import { getAccountDisplay } from '@/utils/accounts';

interface AccountTipsProps {
  type: AccountType;
}

export const AccountTips = memo<AccountTipsProps>(function AccountTips({ type }) {
  const accountDisplay = getAccountDisplay(type);

  return (
    <>
      {accountDisplay && (
        <Tooltip trigger="hover" content={accountDisplay.tip} placement="bottom-start">
          <Box>{accountDisplay.icon}</Box>
        </Tooltip>
      )}
    </>
  );
});
