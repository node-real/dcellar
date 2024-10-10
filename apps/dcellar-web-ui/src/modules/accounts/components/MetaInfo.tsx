import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { Loading } from '@/components/common/Loading';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FULL_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  EStreamRecordStatus,
  selectAccount,
  setEditingPaymentAccountRefundable,
} from '@/store/slices/accounts';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { formatAddress, trimFloatZero } from '@/utils/string';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box, Divider, Flex, Link, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { memo } from 'react';
import { LoadingAdaptor } from './LoadingAdaptor';

type Props = { address: string };

export const MetaInfo = memo(function MetaInfo({ address }: Props) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const accountDetail = useAppSelector(selectAccount(address));
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const router = useRouter();

  const isOwnerAccount = address === loginAccount;
  const loading = !address || isEmpty(accountDetail);
  const availableBalance = isOwnerAccount ? bankBalance : accountDetail.staticBalance;
  const isRefundable = accountDetail.refundable;
  const isFrozen = accountDetail.status === EStreamRecordStatus.FROZEN;

  const onAction = (e: string) => {
    if (e === 'withdraw') {
      return router.push(`/wallet?type=send&from=${address}`);
    }
    if (e === 'deposit') {
      return router.push(`/wallet?type=send&from=${loginAccount}&to=${address}`);
    }
    if (e === 'setNonRefundable') {
      return dispatch(setEditingPaymentAccountRefundable(address));
    }
    return router.push(`/wallet?type=${e}`);
  };

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
                .dp(FULL_DISPLAY_PRECISION)
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
    <Box minW={570} p={16} border={'1px solid readable.border'} borderRadius={4} flex={1}>
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
              <IconFont type={'line-bsc'} w={20} color={'#fff'} />
            </Flex>
            <Text fontSize={24} fontWeight={600}>
              {BN(availableBalance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()}
            </Text>
            <Text fontSize={16} color={'readable.tertiary'} fontWeight={500}>
              {displayTokenSymbol()}
            </Text>
          </Flex>
          <Text fontSize={12} color={'readable.tertiary'}>
            ≈
            {currencyFormatter(
              BN(availableBalance || 0)
                .times(BN(exchangeRate))
                .toString(),
            )}
          </Text>
        </Box>
        {isOwnerAccount && (
          <Flex w={'100%'} gap={16}>
            <DCButton
              size={'md'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('transfer_in')}
            >
              Transfer In
            </DCButton>
            <DCButton
              size={'md'}
              variant="ghost"
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('transfer_out')}
            >
              Transfer Out
            </DCButton>
            <DCButton
              size={'md'}
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
              size={'md'}
              variant={'brand'}
              flex={1}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => onAction('deposit')}
            >
              Deposit
            </DCButton>
            <DCButton
              size={'md'}
              flex={1}
              disabled={!isRefundable || isFrozen}
              variant="ghost"
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('withdraw')}
            >
              Withdraw
            </DCButton>
            <DCButton
              size={'md'}
              flex={1}
              minW={200}
              // paddingX={0}
              whiteSpace={'nowrap'}
              disabled={!isRefundable}
              variant="ghost"
              gaClickName="dc.file.f_detail_pop.share.click"
              onClick={() => onAction('setNonRefundable')}
            >
              Set as Non-Refundable
            </DCButton>
          </Flex>
        )}
      </Flex>
      <Divider marginY={16} />
      <Flex pt={8} gap={8} flexDirection={'column'}>
        {detailItems.map((item, index) => (
          <Flex justifyContent={'space-between'} key={index} h={24}>
            <Text fontSize={14} fontWeight={500} color="readable.tertiary" marginRight={8}>
              {item.label}
            </Text>
            <Box textAlign={'right'}>{item.value}</Box>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
});
