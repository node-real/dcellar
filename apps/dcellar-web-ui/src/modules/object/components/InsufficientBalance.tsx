import { useUnFreezeAmount } from '@/modules/accounts/hooks';
import { useAppSelector } from '@/store';
import { EStreamRecordStatus, selectAccount } from '@/store/slices/accounts';
import { selectLocateBucket } from '@/store/slices/object';
import { displayTokenSymbol } from '@/utils/wallet';
import { ColoredWarningIcon } from '@node-real/icons';
import { Box, Flex } from '@node-real/uikit';

export const InsufficientBalance = () => {
  const bucket = useAppSelector(selectLocateBucket);
  const accountDetail = useAppSelector(selectAccount(bucket.PaymentAddress));
  const amount = useUnFreezeAmount(bucket.PaymentAddress);
  const isFrozen = accountDetail?.status === EStreamRecordStatus.FROZEN;

  return (
    <>
      {isFrozen && (
        <Flex bgColor={'#FDEBE7'} p={'8px 12px'} mb={16} borderRadius={4} color={'#CA300E'} gap={4}>
          <Flex h={20} alignItems={'center'}>
            <ColoredWarningIcon color={'#EE3911'} width={16} />
          </Flex>
          <Box lineHeight={'20px'}>
            This Bucket&apos;s Payment Account is frozen. Currently, all services are restricted. To
            prevent data loss, please contact the owner of the associated Payment Account and
            deposit at least{' '}
            <Box as="span" fontWeight={600}>
              {amount} {displayTokenSymbol()}
            </Box>{' '}
            to reactivate it.
          </Box>
        </Flex>
      )}
    </>
  );
};
