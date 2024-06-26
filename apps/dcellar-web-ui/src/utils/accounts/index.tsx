import { IconFont } from '@/components/IconFont';
import { BillingHistoryQuery } from '@/modules/accounts';
import { AccountType, AccountInfo } from '@/store/slices/accounts';
import dayjs from 'dayjs';
import { InternalRoutePaths } from '@/constants/paths';
import { stringify } from 'querystring';

export const getAccountDisplay = (type: AccountType) => {
  const accountDisplays = {
    error_account: {
      name: 'Invalid Address',
      icon: <IconFont type={'account-error'} w={24} />,
      tip: 'Invalid Address',
    },
    unknown_account: {
      name: 'Unknown Account',
      icon: <IconFont type={'account-unknown'} w={24} />,
      tip: 'Please ensure that you transfer funds to a BNB Greenfield account. Sending to other network addresses may result in permanent loss.',
    },
    gnfd_account: {
      name: 'Greenfield Regular Account',
      icon: <IconFont type={'account-gnfd'} w={24} />,
      tip: 'Greenfield Regular Account',
    },
    payment_account: {
      name: 'Payment Account',
      icon: <IconFont type={'account-payment'} w={24} />,
      tip: 'Payment Account',
    },
    non_refundable_payment_account: {
      name: 'Payment Account (Non-Refundable)',
      icon: <IconFont type={'account-nonrefundable'} w={24} />,
      tip: 'Payment Account (Non-Refundable)',
    },
  };
  return accountDisplays[type];
};

export const formatObjectAddress = (accountInfo: Record<string, AccountInfo>) => {
  const lowerKeyAccountInfo: Record<string, AccountInfo> = {};
  Object.entries(accountInfo).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    lowerKeyAccountInfo[lowerKey] = {
      ...value,
      address: value.address.toLowerCase(),
    };
  });

  return lowerKeyAccountInfo;
};

export const getCurMonthDetailUrl = () => {
  const curQuery: BillingHistoryQuery = {
    page: 1,
    tab: 'b',
    from: dayjs().startOf('M').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
  };

  return `${InternalRoutePaths.accounts}?${stringify(curQuery)}`;
};
