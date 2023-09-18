import GNFDAccountIcon from '@/public/images/accounts/gnfd_account.svg';
import PaymentAccountIcon from '@/public/images/accounts/payment_account.svg';
import NonRefundableIcon from '@/public/images/accounts/non_refundable_account.svg';
import UnknownIcon from '@/public/images/accounts/unknown_account.svg';
import ErrorIcon from '@/public/images/accounts/error_account.svg';

import { AccountType } from '@/store/slices/accounts';

export const getAccountDisplay = (type: AccountType) => {
  const accountDisplays = {
    error_account: {
      name: 'Invalid Address',
      icon: <ErrorIcon />,
      tip: 'Invalid Address',
    },
    unknown_account: {
      name: 'Unknown Account',
      icon: <UnknownIcon />,
      tip: 'Please ensure that you transfer funds to a BNB Greenfield account. Sending to other network addresses may result in permanent loss.',
    },
    gnfd_account: {
      name: 'Greenfield Regular Account',
      icon: <GNFDAccountIcon />,
      tip: 'Greenfield Regular Account',
    },
    payment_account: {
      name: 'Payment Account',
      icon: <PaymentAccountIcon />,
      tip: 'Payment Account',
    },
    non_refundable_payment_account: {
      name: 'Payment Account (Non-Refundable)',
      icon: <NonRefundableIcon />,
      tip: 'Payment Account (Non-Refundable)',
    }
  }
  return accountDisplays[type];
}