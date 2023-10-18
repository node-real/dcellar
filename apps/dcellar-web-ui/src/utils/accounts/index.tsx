import { AccountType } from '@/store/slices/accounts';
import { IconFont } from '@/components/IconFont';

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
