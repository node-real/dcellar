import { useAppSelector } from '@/store';
import { Box, Divider, Flex, Image, Link, QDrawerBody, QDrawerHeader, Text } from '@totejs/uikit';
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

type Props = {
  loading: boolean;
  title: string;
  accountDetail: any;
  availableBalance: string;
}
BigNumber.config({ EXPONENTIAL_AT: 10 });
export const AccountDetail = ({ loading, title, accountDetail, availableBalance }: Props) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const isOwnerAccount = accountDetail?.name?.toLowerCase() === 'owner account';
  const { bankBalance } = useAppSelector((root) => root.accounts);
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
                {BigNumber(balance).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString()} BNB
              </Text>
              <Text color="readable.tertiary" fontSize={12}>
                &nbsp;(
                {currencyFormatter(
                  BigNumber(availableBalance).times(BigNumber(bnbPrice)).toString(DECIMAL_NUMBER),
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
        <Flex marginBottom={8}>
          <LoadingAdaptor loading={loading} empty={false}>
            <Text fontSize={14} fontWeight={500}>
              {BigNumber(accountDetail.bufferBalance || 0)
                .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
                .toString()}{' '}
              BNB
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
