import React, { memo, useEffect } from 'react';
import {
  Box,
  Divider,
  Flex,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  Tooltip,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { AllBucketInfo, setEditQuota, setupBucketQuota } from '@/store/slices/bucket';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { formatId, formatQuota, trimAddress } from '@/utils/string';
import { formatAddress } from '@/modules/buckets/utils/formatAddress';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { GAClick } from '@/components/common/GATracker';
import { CopyText } from '@/components/common/CopyText';
import { Label } from '@/modules/buckets/List/components/BucketDetail';
import BucketIcon from '@/public/images/buckets/bucket-icon.svg';
import { selectBucketSp } from '@/store/slices/sp';
import dayjs from 'dayjs';
import { DCButton } from '@/components/common/DCButton';

interface DetailOperationProps {
  selectedBucketInfo: AllBucketInfo;
}

export const DetailOperation = memo<DetailOperationProps>(function DetailDrawer({
  selectedBucketInfo,
}) {
  const dispatch = useAppDispatch();
  const { quotas } = useAppSelector((root) => root.bucket);
  const quota = quotas[selectedBucketInfo.BucketName];
  const endDate = dayjs().utc?.().endOf('month').format('D MMM, YYYY');
  const formattedQuota = formatQuota(quota);
  const { accountDetails } = useAppSelector((root) => root.accounts);
  const primarySp = useAppSelector(selectBucketSp(selectedBucketInfo))!;

  const getContent = () => {
    const CreateAt = getMillisecond(selectedBucketInfo.CreateAt);
    const spName = primarySp.moniker;
    const payAccountName = accountDetails[selectedBucketInfo.PaymentAddress]?.name;
    const infos = [
      {
        canCopy: false,
        label: 'Date created',
        value: formatFullTime(CreateAt),
        display: formatFullTime(CreateAt),
        href: '',
      },
      {
        canCopy: true,
        label: 'Primary SP address',
        name: spName,
        value: primarySp.operatorAddress || '--',
        display: primarySp.operatorAddress ? trimAddress(primarySp.operatorAddress) : '--',
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        name: payAccountName,
        value: selectedBucketInfo.PaymentAddress,
        display: `${trimAddress(selectedBucketInfo.PaymentAddress)}`,
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        gaClickName: 'dc.bucket.b_detail_pop.payment.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Bucket ID',
        value: formatId(Number(selectedBucketInfo.Id)),
        display: formatAddress(formatId(Number(selectedBucketInfo.Id))),
        copyGaClickName: 'dc.bucket.b_detail_pop.id_copy.click',
        gaClickName: 'dc.bucket.b_detail_pop.id.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        label: 'Create transaction hash',
        value: selectedBucketInfo.CreateTxHash,
        display: formatAddress(selectedBucketInfo.CreateTxHash),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_create_tx_hash.click',
        gaClickName: 'dc.bucket.b_detail_pop.create_tx_hash.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/tx`,
      },
    ];

    return (
      <>
        {infos.map((item) => (
          <Flex
            key={item.label}
            justifyContent={'space-between'}
            color="readable.tertiary"
            alignItems="center"
            h={28}
            _notLast={{
              mb: 3,
            }}
          >
            <Label>{item.label}</Label>
            <Flex>
              {item.label === 'Date created' && (
                <Text fontSize={'14px'} fontWeight={500} color="readable.normal">
                  {item.display}
                </Text>
              )}
              {item.label !== 'Date created' &&
                (item.canCopy ? (
                  <>
                    <Text color={'readable.normal'} fontSize={'14px'} fontWeight={500}>
                      {item.name ? `${item.name} |` : ''}&nbsp;
                    </Text>
                    <GAClick name={item.gaClickName}>
                      <Link
                        target="_blank"
                        color="#1184EE"
                        cursor={'pointer'}
                        textDecoration={'underline'}
                        _hover={{
                          color: '#3C9AF1',
                        }}
                        href={`${item.href}/${item.value}`}
                        fontSize={'14px'}
                        fontWeight={500}
                      >
                        {item.display}
                      </Link>
                    </GAClick>
                  </>
                ) : (
                  <Link
                    target="_blank"
                    color="#1184EE"
                    cursor={'pointer'}
                    textDecoration={'underline'}
                    _hover={{
                      color: '#3C9AF1',
                    }}
                    href={`${item.href}/${item.value}`}
                    fontSize={'14px'}
                    fontWeight={500}
                  >
                    {item.display}
                  </Link>
                ))}
              {item.canCopy && <CopyText value={item.value} gaClickName={item.copyGaClickName} />}
            </Flex>
          </Flex>
        ))}

        <Flex
          justifyContent={'space-between'}
          color="readable.tertiary"
          alignItems="center"
          h={28}
          _notLast={{
            mb: 3,
          }}
        >
          <Label>Free quota (one-time)</Label>
          <Flex>
            <Text fontSize={'14px'} fontWeight={500} color="readable.normal">
              {formattedQuota.totalFreeText}{' '}
              <Text as="span" color="#76808F">
                ({formattedQuota.remainFreeText} remaining)
              </Text>
            </Text>
          </Flex>
        </Flex>
        <Flex
          justifyContent={'space-between'}
          color="readable.tertiary"
          alignItems="flex-start"
          my={6}
          _notLast={{
            mb: 3,
          }}
        >
          <Label>Monthly quota</Label>
          <Flex flexDirection={'column'} alignItems="flex-end">
            <Text fontSize={'14px'} fontWeight={500} color="readable.normal">
              {formattedQuota.totalReadText}/mo{' '}
              <Text as="span" color="#76808F">
                ({formattedQuota.remainReadText} remaining)
              </Text>
            </Text>
            <Text>Expire date: {endDate}</Text>
          </Flex>
        </Flex>
      </>
    );
  };

  useEffect(() => {
    dispatch(setupBucketQuota(selectedBucketInfo.BucketName));
  }, [selectedBucketInfo.BucketName, dispatch]);

  const manageQuota = () => {
    dispatch(setEditQuota([selectedBucketInfo.BucketName, 'drawer']));
  };

  return (
    <>
      <QDrawerHeader>Bucket Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex my={32}>
          <BucketIcon />
          <Box marginLeft={'24px'} flex={1}>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px">
              Name
            </Text>
            <Text fontSize={'14px'} fontWeight={500} wordBreak="break-all">
              {selectedBucketInfo.BucketName}
            </Text>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px" marginTop="8px">
              Remaining Quota
            </Text>
            <Tooltip
              maxW="365px"
              content={
                <Box fontSize={12} lineHeight="normal" color="#1E2026">
                  <Box>Free quota: {formattedQuota.remainFreeText} remaining.</Box>
                  <Box whiteSpace="nowrap">
                    Monthly quota: {formattedQuota.remainReadText} remaining.
                    <Text
                      as="span"
                      color="#76808F"
                      transform="scale(0.8333)"
                      transformOrigin="left center"
                      display="inline-flex"
                      ml={4}
                    >
                      (Expire date: {endDate})
                    </Text>
                  </Box>
                </Box>
              }
              placement="bottom"
            >
              <Flex bg="#F5F5F5" height={8} my={4} alignItems={'center'}>
                <Box bg="#00BA34" height={8} w={`${formattedQuota.readRemainPercent}%`} />
                <Box bg="#91E1A8" height={8} w={`${formattedQuota.freeRemainPercent}%`} />
              </Flex>
            </Tooltip>
            <Text
              display="flex"
              justifyContent="space-between"
              fontSize={'14px'}
              fontWeight={500}
              wordBreak="break-all"
            >
              {formattedQuota.show}{' '}
              <Text
                as="span"
                color="#00BA34"
                _hover={{ color: '#2EC659' }}
                cursor="pointer"
                onClick={manageQuota}
              >
                Increase Quota
              </Text>
            </Text>
          </Box>
        </Flex>
        <Divider marginBottom={16} />
        {getContent()}
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton
          backgroundColor={'readable.brand6'}
          height={'48px'}
          width={'100%'}
          onClick={manageQuota}
        >
          Manage Quota
        </DCButton>
      </QDrawerFooter>
    </>
  );
});
