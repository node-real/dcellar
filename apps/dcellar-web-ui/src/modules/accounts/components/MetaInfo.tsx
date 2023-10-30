import { useAppSelector } from '@/store';
import { Box, Divider, Flex, Link, Text } from '@totejs/uikit';
import React, { memo, useMemo } from 'react';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { formatAddress, trimFloatZero } from '@/utils/string';
import { CopyText } from '@/components/common/CopyText';
import { selectBnbPrice } from '@/store/slices/global';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  MIN_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { LoadingAdaptor } from './LoadingAdaptor';
import { useRouter } from 'next/router';
import { selectAccountDetail } from '@/store/slices/accounts';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { BN } from '@/utils/math';
import { IconFont } from '@/components/IconFont';
import { displayTokenSymbol } from '@/utils/wallet';
import { isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';
import { DCButton } from '@/components/common/DCButton';
import { currencyFormatter } from '@/utils/formatter';
import { useWhyDidYouUpdate } from 'ahooks';

type Props = {
  address: string;
};
export const MetaInfo = memo(({ address }: Props) => {
  const router = useRouter();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOwnerAccount = address === loginAccount;
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const accountDetail = useAppSelector(selectAccountDetail(address));
  const loading = !address || isEmpty(accountDetail);
  const onAction = (e: string) => {
    if (e === 'withdraw') {
      return router.push(`/wallet?type=send&from=${address}`);
    }
    if (e === 'deposit') {
      return router.push(`/wallet?type=send&from=${loginAccount}&to=${address}`);
    }
    return router.push(`/wallet?type=${e}`);
  };
  useWhyDidYouUpdate('11321321', [bnbPrice, address, bankBalance, loginAccount, accountDetail])
  const availableBalance = isOwnerAccount ? bankBalance : accountDetail.staticBalance;
  const isNonRefundable = accountDetail.refundable;
  const isFrozen = accountDetail.clientFrozen;
  const detailItems = [
    {
      label: 'Account address',
      value: (
        <Flex>
          <Link
            target="_blank"
            color="#1184EE"
            cursor={'pointer'}
            textDecoration={'underline'}
            _hover={{
              color: '#3C9AF1',
            }}
            href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`}
            fontSize={'14px'}
            fontWeight={500}
          >
            {formatAddress(address)}
          </Link>
          <CopyText value={address} gaClickName={address} />
        </Flex>
      ),
    },
    {
      label: 'Prepaid fee',
      value: (
        <Flex>
          <LoadingAdaptor loading={loading} empty={false}>
            <Text fontSize={14} fontWeight={500}>
              {BN(accountDetail.bufferBalance || 0)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
                .toString()}{' '}
              {displayTokenSymbol()}
            </Text>
          </LoadingAdaptor>
        </Flex>
      ),
    },
    {
      label: 'Flow rate',
      value: (
        <LoadingAdaptor loading={loading} empty={false}>
          <Text fontSize={14} fontWeight={500}>
            {trimFloatZero(
              BN(accountDetail?.netflowRate || 0)
                .dp(MIN_DISPLAY_PRECISION)
                .toString(),
            )}{' '}
            {displayTokenSymbol()}/s
          </Text>
        </LoadingAdaptor>
      ),
    },
    {
      label: 'Last update date',
      value: (
        <LoadingAdaptor loading={loading} empty={false}>
          <Text fontSize={14} fontWeight={500}>
            {formatFullTime(getMillisecond(accountDetail?.crudTimestamp))}
          </Text>
        </LoadingAdaptor>
      ),
    },
    {
      label: 'Force settlement date',
      value: (
        <LoadingAdaptor loading={loading} empty={false}>
          <Text fontSize={14} fontWeight={500}>
            {formatFullTime(getMillisecond(accountDetail?.settleTimestamp))}
          </Text>
        </LoadingAdaptor>
      ),
    },
  ];

  if (loading) {
    return (
      <Box p={16} border={'1px solid readable.border'} borderRadius={4} flex={1} minH={373}>
        <Loading />
      </Box>
    );
  }
  return (
    <Box p={16} border={'1px solid readable.border'} borderRadius={4} flex={1}>
      <Flex gap={12} flexDirection={'column'}>
        <Text fontSize={16} fontWeight={600}>
          Balance
        </Text>
        <Box>
          <Flex gap={8} alignItems={'center'} mb={8}>
            <Flex
              alignItems={'center'}
              justifyContent={'center'}
              borderRadius={'50%'}
              bg={'#F0B90B'}
              w={24}
              h={24}
            >
              <IconFont type={'bsc'} w={20} color={'#fff'} />
            </Flex>
            <Text fontSize={24} fontWeight={600}>
              {BN(availableBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}
            </Text>
            <Text color={'readable.tertiary'} fontWeight={500}>
              {displayTokenSymbol()}
            </Text>
          </Flex>
          <Text fontSize={12} color={'readable.tertiary'}>
            ≈{currencyFormatter(
                BN(availableBalance || 0)
                  .times(BN(bnbPrice))
                  .toString(),
              )}
          </Text>
        </Box>
        {isOwnerAccount && (
          <Flex w={'100%'} gap={16}>
            <DCButton
              size={'lg'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('transfer_in')}
            >
              Transfer In
            </DCButton>
            <DCButton
              size={'lg'}
              variant="ghost"
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('transfer_out')}
            >
              Transfer Out
            </DCButton>
            <DCButton
              size={'lg'}
              variant="ghost"
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('send')}
            >
              Send
            </DCButton>
          </Flex>
        )}
        {!isOwnerAccount && (
          <Flex w={'100%'} gap={16}>
            <DCButton
              size={'lg'}
              variant={'brand'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('deposit')}
            >
              Deposit
            </DCButton>
            {isNonRefundable && !isFrozen && (
              <DCButton
                size={'lg'}
                flex={1}
                variant="ghost"
                gaClickName="dc.file.f_detail_pop.share.click"
                onClick={() => onAction('withdraw')}
              >
                Withdraw
              </DCButton>
            )}
          </Flex>
        )}
      </Flex>
      <Divider marginY={24} />
      <Flex gap={8} flexDirection={'column'}>
        {detailItems.map((item, index) => (
          <Flex justifyContent={'space-between'} key={index} h={24}>
            <Text fontSize={14} fontWeight={500} color="readable.tertiary" marginRight={8}>
              {item.label}
            </Text>
            {item.value}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
});
