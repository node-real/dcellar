import { InternalRoutePaths } from '@/constants/paths';
import { useUnFreezeAmount } from '@/modules/accounts/hooks';
import { useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { selectLocateBucket } from '@/store/slices/object';
import { displayTokenSymbol } from '@/utils/wallet';
import { ColoredWarningIcon } from '@node-real/icons';
import { Flex, Link } from '@node-real/uikit';
import { useRouter } from 'next/router';

export const InsufficientBalance = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  const router = useRouter();
  const bucket = useAppSelector(selectLocateBucket);
  const accountDetail = useAppSelector(selectAccount(bucket.PaymentAddress));
  const amount = useUnFreezeAmount(bucket.PaymentAddress);

  const isOwnerAccount = bucket.PaymentAddress === loginAccount;
  const isFrozen = accountDetail?.clientFrozen;

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
          Insufficient Balance. Please deposit at least <strong>&nbsp;{amount}&nbsp;</strong>{' '}
          {displayTokenSymbol()} to renew your service, or your objects may be permanently
          deleted.&nbsp;
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
