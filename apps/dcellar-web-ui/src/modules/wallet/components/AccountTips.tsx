import React from 'react';
import { Box, Popover, PopoverContent, PopoverTrigger, Tooltip } from '@totejs/uikit';
import { AccountType } from '@/store/slices/accounts';
import { getAccountDisplay } from '@/utils/accounts';
import { deepReadDirSync } from '@sentry/nextjs';

type AccountTipsProps = {
  type: AccountType;
};

export const AccountTips = ({ type }: AccountTipsProps) => {
  const accountDisplay = getAccountDisplay(type);
  return (
    <>
      {accountDisplay && (
        <Popover trigger="hover" matchWidth={true}>
          <PopoverTrigger>
            <Box>{accountDisplay.icon}</Box>
          </PopoverTrigger>
          <PopoverContent
            minW={140}
            maxW={245}
            w="fit-content"
            bg={'white'}
            p={8}
            color={'readable.normal'}
          >
            {accountDisplay.tip}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
