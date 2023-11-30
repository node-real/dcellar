import { useAppSelector } from '@/store';
import { selectLocateBucket } from '@/store/slices/object';
import { ColoredWarningIcon } from '@totejs/icons';
import { Flex, Link } from '@totejs/uikit';
import React from 'react';
import { useRouter } from 'next/router';
import { useUnFreezeAmount } from '@/modules/accounts/hooks';
import { selectAccount } from '@/store/slices/accounts';
import { InternalRoutePaths } from '@/constants/paths';
import { displayTokenSymbol } from '@/utils/wallet';

export const InsufficientBalance = () => {
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const bucket = useAppSelector(selectLocateBucket);
  const accountDetail = useAppSelector(selectAccount(bucket.PaymentAddress));
  const isOwnerAccount = bucket.PaymentAddress === loginAccount;
  const isFrozen = accountDetail?.clientFrozen;
  const amount = useUnFreezeAmount(bucket.PaymentAddress);
  const onTopUpClick = () => {
    const topUpUrl = isOwnerAccount
      ? InternalRoutePaths.transfer_in
      : `${InternalRoutePaths.send}&from=${loginAccount}&to=${bucket.PaymentAddress}&amount=${amount}`;
    router.push(topUpUrl);
  };

  return (
    <>
      {isFrozen && (
        <Flex bgColor={'#FDEBE7'} p={8} alignItems={'center'} mb={16} borderRadius={4}>
          <ColoredWarningIcon color={'#EE3911'} width={16} mr={8} />
          Insufficient Balance. Please deposit at least <strong>&nbsp;{amount}&nbsp;</strong> {displayTokenSymbol()} to
          renew your service, or your objects may be permanently deleted.&nbsp;
          <Link
            fontWeight={500}
            textDecoration={'underline'}
            color={'readable.normal'}
            _hover={{ color: 'readable.normal' }}
            cursor={'pointer'}
            onClick={() => {
              onTopUpClick();
            }}
          >
            Top Up
          </Link>
        </Flex>
      )}
    </>
  );
};
