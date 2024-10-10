import { IconFont } from '@/components/IconFont';
import { Tips } from '@/components/common/Tips';
import { InternalRoutePaths } from '@/constants/paths';
import { useAppSelector } from '@/store';
import { EStreamRecordStatus } from '@/store/slices/accounts';
import { selectStoreFeeParams } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box, Flex, Link, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export const AccountDetailNav = ({ address }: { address: string }) => {
  const router = useRouter();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);

  const curAddress = address as string;
  const isOwnerAccount = address === loginAccount;
  const accountDetail = accountInfos?.[curAddress] || {};
  const isFrozen = accountDetail.status === EStreamRecordStatus.FROZEN;
  const loading = !address || isEmpty(accountDetail);

  const unFreezeAmount = useMemo(() => {
    return BN(storeFeeParams.reserveTime).times(BN(accountDetail?.frozenNetflowRate)).toString();
  }, [accountDetail?.frozenNetflowRate, storeFeeParams?.reserveTime]);

  const goBack = () => {
    router.push('/accounts');
  };

  const onTopUpClick = () => {
    const url = isOwnerAccount
      ? InternalRoutePaths.transfer_in
      : `${InternalRoutePaths.send}&from=${loginAccount}&to=${accountDetail.address}`;

    router.push(url);
  };

  return (
    <Flex gap={16} alignItems={'center'} onClick={goBack} cursor={'pointer'}>
      <IconFont type="backward" w={24} />
      <Text fontSize={24} fontWeight={700}>
        {accountDetail.name}
      </Text>
      {isFrozen && (
        <Tips
          containerWidth={280}
          iconSize={16}
          padding={4}
          iconStyle={{
            color: '#F15D3C',
            _hover: {
              color: '#F15D3C',
            },
            marginTop: '-1px',
          }}
          trigger="hover"
          tips={
            <Box>
              <Text fontSize={14} fontWeight={600} mb={4}>
                Frozen Account
              </Text>
              <Text fontSize={14} fontWeight={400} color="readable.normal" mb={4}>
                Your account is suspended due to insufficient balance. To reactivate your account,
                please deposit at least &nbsp;
                <strong>
                  {unFreezeAmount} &nbsp;{displayTokenSymbol()}
                </strong>
                &nbsp; immediately.
              </Text>
              <Link
                cursor={'pointer'}
                display={'inline-block'}
                textDecoration={'underline'}
                w="100%"
                textAlign={'right'}
                onClick={() => onTopUpClick()}
              >
                Top Up
              </Link>
            </Box>
          }
        />
      )}
      <Box>
        {!loading && accountDetail?.refundable === false && (
          <Box
            padding={'4px 8px'}
            borderRadius={16}
            bgColor={'bg.bottom'}
            fontSize={12}
            fontWeight={500}
            w="fit-content"
            color={'readable.tertiary'}
          >
            Non-Refundable
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default AccountDetailNav;
