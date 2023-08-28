import React, { memo, useEffect, useMemo } from 'react';
import {
  QDrawerHeader,
  QDrawerBody,
  Flex,
  Text,
  Link,
  Box,
  Divider,
  QDrawerFooter,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { BucketItem, setEditDetail, setEditQuota, setupBucketQuota } from '@/store/slices/bucket';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { formatId } from '@/utils/string';
import { formatAddress } from '@/modules/buckets/utils/formatAddress';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { GAClick } from '@/components/common/GATracker';
import { CopyText } from '@/components/common/CopyText';
import { Label } from '@/modules/buckets/List/components/BucketDetail';
import { formatBytes } from '@/modules/file/utils';
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
  const endDate = dayjs().utc().endOf('month').format('D MMM, YYYY');

  const transformedRemainingQuota = useMemo(() => {
    if (!quota)
      return {
        remain: 0,
        text: '--',
        free: '--',
        read: '--',
      };
    const { freeQuota, readQuota, consumedQuota } = quota;
    const remainingQuota = readQuota + freeQuota - consumedQuota;
    return {
      free: formatBytes(freeQuota, true).replace(' ', ''),
      read: !readQuota ? '0G' : formatBytes(readQuota, true).replace(' ', ''),
      remain: (remainingQuota / (freeQuota + readQuota)) * 100,
      text: `${formatBytes(remainingQuota, true)} / ${formatBytes(freeQuota + readQuota)}`,
    };
  }, [quota]);
  const getContent = () => {
    if (!isOpen) return;
    const CreateAt = getMillisecond(editDetail.CreateAt);
    const infos = [
      {
        canCopy: false,
        label: 'Date Created',
        value: formatFullTime(CreateAt),
        display: formatFullTime(CreateAt),
        href: '',
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
        label: 'Primary SP address',
        value: editDetail?.PrimarySpAddress || '--',
        display: editDetail?.PrimarySpAddress ? formatAddress(editDetail.PrimarySpAddress) : '--',
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        value: bucket.PaymentAddress,
        display: formatAddress(bucket.PaymentAddress),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        gaClickName: 'dc.bucket.b_detail_pop.payment.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
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
                {item.label === 'Date Created' && (
                  <Text fontSize={'14px'} fontWeight={500} color="readable.normal">
                    {item.display}
                  </Text>
                )}
                {item.label !== 'Date Created' &&
                  (item.canCopy ? (
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
              {transformedRemainingQuota.free}
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
              {transformedRemainingQuota.read}/mo
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
            <Box bg="#F5F5F5" height={8} my={4}>
              <Box bg="#00BA34" height={8} w={`${transformedRemainingQuota.remain}%`} />
            </Box>
            <Text
              display="flex"
              justifyContent="space-between"
              fontSize={'14px'}
              fontWeight={500}
              wordBreak="break-all"
            >
              {transformedRemainingQuota.text}{' '}
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
