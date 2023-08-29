import { useAppSelector } from '@/store';
import {
  Box,
  Divider,
  Flex,
  Image,
  Link,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerHeader,
  Text,
} from '@totejs/uikit';
import React from 'react';
import { GREENFIELD_CHAIN_EXPLORER_URL, assetPrefix } from '@/base/env';
import { trimAddress } from '@/utils/string';
import { CopyText } from '@/components/common/CopyText';
import BigNumber from 'bignumber.js';
import { selectBnbPrice } from '@/store/slices/global';
import { currencyFormatter } from '@/utils/currencyFormatter';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { LoadingAdaptor } from './LoadingAdaptor';
import { trimFloatZero } from '@/utils/trimFloatZero';
import { Tips } from '@/components/common/Tips';
import { getNumInDigits } from '@/utils/wallet';
import { selectBalance } from '@/store/slices/balance';

export const AccountDetail = ({ loading, title, accountDetail, lockFee }: any) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const isOwnerAccount = accountDetail?.name?.toLowerCase() === 'owner account';
  const {bankBalance} = useAppSelector(root=> root.accounts);
  const balance = isOwnerAccount
    ? BigNumber(accountDetail?.staticBalance || 0)
        .plus(BigNumber(bankBalance))
        .toString(DECIMAL_NUMBER)
    : BigNumber(accountDetail?.staticBalance || 0).toString(DECIMAL_NUMBER);

  const detailItems = [
    {
      label: title,
      value: (
        <Flex marginBottom={8}>
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
        <Flex marginBottom={8}>
          <LoadingAdaptor loading={loading} empty={false}>
            <>
              <Text fontSize={14} fontWeight={500}>
                {getNumInDigits(balance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB
              </Text>
              <Text color="readable.tertiary" fontSize={12}>
                (
                {currencyFormatter(
                  BigNumber(balance).times(BigNumber(bnbPrice)).toString(DECIMAL_NUMBER),
                )}
                )
              </Text>
            </>
          </LoadingAdaptor>
        </Flex>
      ),
    },
    {
      label: 'Locked Storage fee',
      value: (
        <Flex marginBottom={8}>
          <LoadingAdaptor loading={loading} empty={false}>
            <Text fontSize={14} fontWeight={500}>
              {trimFloatZero(
                BigNumber(lockFee || 0)
                  .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
                  .toString(DECIMAL_NUMBER),
              )}{' '}
              BNB
            </Text>
          </LoadingAdaptor>
        </Flex>
      ),
    },
    {
      label: 'Flow Rate',
      value: (
        <LoadingAdaptor loading={loading} empty={false}>
          <Text fontSize={14} fontWeight={500}>
            ≈{' '}
            {trimFloatZero(
              BigNumber(accountDetail?.netflowRate || 0)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
                .toString(DECIMAL_NUMBER),
            )}{' '}
            BNB/s
          </Text>
        </LoadingAdaptor>
      ),
    },
  ];

  return (
    <>
      <QDrawerHeader fontWeight={600} fontSize={24} lineHeight="32px">
        {title}
      </QDrawerHeader>
      <QDrawerCloseButton top={16} right={24} color="readable.tertiary" />
      <QDrawerBody>
        <Flex alignItems={'flex-start'}>
          <Image
            alt="account icon"
            src={`${assetPrefix}/images/accounts/filled-account.svg`}
            width={120}
            height={120}
            marginRight={24}
          />
          <Box>
            <Flex alignItems={'center'}>
              <Text fontSize={14} fontWeight={500}>
                {accountDetail?.name}
              </Text>
              {accountDetail?.status === 1 && (
                <Tips
                  containerWidth={280}
                  iconSize={16}
                  padding={4}
                  iconStyle={{
                    color: '#F15D3C',
                    _hover: {
                      color: '#F15D3C',
                    },
                  }}
                  trigger="click"
                  tips={
                    <Box>
                      <Text fontSize={14} fontWeight={500} mb={4}>
                        Frozen Account
                      </Text>
                      <Text fontSize={14} fontWeight={400} color="readable.normal" mb={4}>
                        Your account is suspended due to insufficient balance. To reactivate your
                        account, please deposit it immediately.
                      </Text>
                      <Link
                        cursor={'pointer'}
                        display={'inline-block'}
                        textDecoration={'underline'}
                        w="100%"
                        href="/wallet?type=send"
                        textAlign={'right'}
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
        {detailItems.map((item, index) => (
          <Flex justifyContent={'space-between'} key={index}>
            <Text fontSize={14} fontWeight={500} color="readable.tertiary" marginRight={8}>
              {item.label}
            </Text>
            {item.value}
          </Flex>
        ))}
      </QDrawerBody>
    </>
  );
};
