import { useAppSelector } from '@/store';
import { Box, Divider, Flex, Link, QDrawerBody, QDrawerHeader, Text } from '@totejs/uikit';
import React, { useMemo } from 'react';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { trimAddress, trimFloatZero } from '@/utils/string';
import { CopyText } from '@/components/common/CopyText';
import { selectBnbPrice, selectStoreFeeParams } from '@/store/slices/global';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  FULL_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { LoadingAdaptor } from './LoadingAdaptor';
import { Tips } from '@/components/common/Tips';
import { useRouter } from 'next/router';
import { TAccountInfo } from '@/store/slices/accounts';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { BN } from '@/utils/math';
import { InternalRoutePaths } from '@/utils/constant';
import { currencyFormatter } from '@/utils/formatter';
import { IconFont } from '@/components/IconFont';
import { displayTokenSymbol } from '@/utils/wallet';

type Props = {
  loading: boolean;
  title: string;
  accountDetail: TAccountInfo;
  availableBalance: string;
};

export const BasicInfo = ({ loading, title, accountDetail, availableBalance }: Props) => {
  const router = useRouter();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const isOwnerAccount = accountDetail?.name?.toLowerCase() === 'owner account';
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const balance = isOwnerAccount
    ? BN(accountDetail?.staticBalance || 0)
        .plus(BN(bankBalance))
        .toString(DECIMAL_NUMBER)
    : BN(accountDetail?.staticBalance || 0).toString(DECIMAL_NUMBER);
  const isFrozen = accountDetail?.clientFrozen;

  const unFreezeAmount = useMemo(() => {
    return BN(storeFeeParams.reserveTime).times(BN(accountDetail?.frozenNetflowRate)).toString();
  }, [accountDetail?.frozenNetflowRate, storeFeeParams?.reserveTime]);

  const onTopUpClick = () => {
    const url = isOwnerAccount
      ? InternalRoutePaths.transfer_in
      : `${InternalRoutePaths.send}&from=${loginAccount}&to=${accountDetail.address}`;

    router.push(url);
  };
  const detailItems = [
    {
      label: 'Account address',
      value: (
        <Flex>
          <Text fontSize={'14px'} fontWeight={500}>
            {accountDetail?.name} | &nbsp;
          </Text>
          <Link
            target="_blank"
            color="#1184EE"
            cursor={'pointer'}
            textDecoration={'underline'}
            _hover={{
              color: '#3C9AF1',
            }}
            href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${accountDetail?.address}`}
            fontSize={'14px'}
            fontWeight={500}
          >
            {trimAddress(accountDetail?.address)}
          </Link>
          <CopyText value={accountDetail?.address} gaClickName={accountDetail?.address} />
        </Flex>
      ),
    },
    {
      label: 'Balance',
      value: (
        <Flex>
          <LoadingAdaptor loading={loading} empty={false}>
            <>
              <Text fontSize={14} fontWeight={500}>
                {BN(balance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()} {displayTokenSymbol()}
              </Text>
              <Text color="readable.tertiary" fontSize={12}>
                &nbsp;(
                {currencyFormatter(
                  BN(availableBalance).times(BN(bnbPrice)).toString(DECIMAL_NUMBER),
                )}
                )
              </Text>
            </>
          </LoadingAdaptor>
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

  return (
    <>
      <QDrawerHeader>{title}</QDrawerHeader>
      <QDrawerBody>
        <Flex alignItems={'flex-start'}>
          <IconFont type={'detail-account'} w={48} mr={24} />
          <Box>
            <Flex alignItems={'center'}>
              <Text fontSize={14} fontWeight={500}>
                {accountDetail?.name}
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
                        Your account is suspended due to insufficient balance. To reactivate your
                        account, please deposit at least &nbsp;
                        <strong>{unFreezeAmount} &nbsp;{displayTokenSymbol()}</strong>&nbsp; immediately.
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
            </Flex>
            {!loading && accountDetail?.refundable === false && (
              <Box
                marginTop={8}
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
      </QDrawerBody>
    </>
  );
};
