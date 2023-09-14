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
import { BucketItem, setEditDetail, setEditQuota, setupBucketQuota } from '@/store/slices/bucket';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { formatId, formatQuota, trimAddress } from '@/utils/string';
import { formatAddress } from '@/modules/buckets/utils/formatAddress';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { GAClick } from '@/components/common/GATracker';
import { CopyText } from '@/components/common/CopyText';
import { Label } from '@/modules/buckets/List/components/BucketDetail';
import BucketIcon from '@/public/images/buckets/bucket-icon.svg';
import { DCDrawer } from '@/components/common/DCDrawer';
import { getClient } from '@/base/client';
import { SpItem } from '@/store/slices/sp';
import { useAsyncEffect } from 'ahooks';
import dayjs from 'dayjs';
import { DCButton } from '@/components/common/DCButton';

interface DetailDrawerProps {}

export const DetailDrawer = memo<DetailDrawerProps>(function DetailDrawer() {
  const dispatch = useAppDispatch();
  const { editDetail, quotas, bucketInfo } = useAppSelector((root) => root.bucket);
  const { allSps } = useAppSelector((root) => root.sp);
  const isOpen = !!editDetail.BucketName;
  const quota = quotas[editDetail.BucketName];
  const bucket = bucketInfo[editDetail.BucketName] || {};
  const endDate = dayjs().utc?.().endOf('month').format('D MMM, YYYY');
  const formattedQuota = formatQuota(quota);
  const { spInfo } = useAppSelector((root) => root.sp);
  const { accountDetails } = useAppSelector((root) => root.accounts);

  const getContent = () => {
    if (!isOpen || !editDetail) return;
    const CreateAt = getMillisecond(editDetail.CreateAt);
    const spName = editDetail.PrimarySpAddress && spInfo[editDetail.PrimarySpAddress]?.moniker;
    const payAccountName = bucket.PaymentAddress && accountDetails[bucket.PaymentAddress]?.name;
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
        value: editDetail?.PrimarySpAddress || '--',
        display: editDetail?.PrimarySpAddress ? trimAddress(editDetail.PrimarySpAddress) : '--',
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        name: payAccountName,
        value: bucket.PaymentAddress,
        display: `${trimAddress(bucket.PaymentAddress)}`,
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        gaClickName: 'dc.bucket.b_detail_pop.payment.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Bucket ID',
        value: formatId(Number(bucket.Id)),
        display: formatAddress(formatId(Number(bucket.Id))),
        copyGaClickName: 'dc.bucket.b_detail_pop.id_copy.click',
        gaClickName: 'dc.bucket.b_detail_pop.id.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        label: 'Create transaction hash',
        value: editDetail.CreateTxHash,
        display: formatAddress(editDetail.CreateTxHash),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_create_tx_hash.click',
        gaClickName: 'dc.bucket.b_detail_pop.create_tx_hash.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/tx`,
      },
      // {
      //   canCopy: true,
      //   label: 'Update transaction hash',
      //   value: editDetail.update_tx_hash,
      //   display: formatAddress(editDetail.update_tx_hash),
      //   copyGaClickName: 'dc.bucket.b_detail_pop.copy_update_tx_hash.click',
      //   gaClickName: 'dc.bucket.b_detail_pop.update_tx_hash.click',
      //   href: `${GREENFIELD_CHAIN_EXPLORER_URL}/tx`,
      // },
    ];

    return (
      <>
        {infos &&
          infos.map((item) => (
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
    if (!editDetail.BucketName) return;
    dispatch(setupBucketQuota(editDetail.BucketName));
  }, [editDetail.BucketName, dispatch]);

  useAsyncEffect(async () => {
    if (!editDetail.BucketName || editDetail.PrimarySpAddress) return;
    const client = await getClient();
    const endpoint = await client.sp.getSPUrlByBucket(editDetail.BucketName);
    const primarySp = allSps.find((sp: SpItem) => sp.endpoint === endpoint) as SpItem;
    dispatch(
      setEditDetail({
        ...editDetail,
        PrimarySpAddress: primarySp.operatorAddress,
      }),
    );
  }, [editDetail]);

  const onClose = () => {
    dispatch(setEditDetail({} as BucketItem));
  };

  const manageQuota = () => {
    dispatch(setEditQuota([editDetail.BucketName, 'drawer']));
  };

  return (
    <DCDrawer isOpen={isOpen} onClose={onClose}>
      <QDrawerHeader>Bucket Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex my={32}>
          <BucketIcon />
          <Box marginLeft={'24px'} flex={1}>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px">
              Name
            </Text>
            <Text fontSize={'14px'} fontWeight={500} wordBreak="break-all">
              {editDetail.BucketName}
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
          variant="dcPrimary"
          backgroundColor={'readable.brand6'}
          height={'48px'}
          width={'100%'}
          onClick={manageQuota}
        >
          Manage Quota
        </DCButton>
      </QDrawerFooter>
    </DCDrawer>
  );
});
