import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  QDrawerCloseButton,
  QDrawerHeader,
  QDrawerBody,
  Flex,
  Text,
  Link,
  Box,
  Divider,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { BucketItem, setEditDetail, setupBucketQuota } from '@/store/slices/bucket';
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
import { useAsync } from 'react-use';
import { getClient } from '@/base/client';
import { SpItem } from '@/store/slices/sp';
import { useAsyncEffect } from 'ahooks';

interface DetailDrawerProps {}

export const DetailDrawer = memo<DetailDrawerProps>(function DetailDrawer() {
  const dispatch = useAppDispatch();
  const { editDetail, quotas, bucketInfo } = useAppSelector((root) => root.bucket);
  const { allSps } = useAppSelector((root) => root.sp);
  const isOpen = !!editDetail.bucket_name;
  const quota = quotas[editDetail.bucket_name];
  const bucket = bucketInfo[editDetail.bucket_name] || {};
  const getContent = () => {
    if (!isOpen) return;
    const create_at = getMillisecond(editDetail.create_at);
    const infos = [
      {
        canCopy: false,
        label: 'Date Created',
        value: formatFullTime(create_at),
        display: formatFullTime(create_at),
        href: '',
      },
      {
        canCopy: true,
        label: 'Bucket ID',
        value: formatId(Number(bucket.id)),
        display: formatAddress(formatId(Number(bucket.id))),
        copyGaClickName: 'dc.bucket.b_detail_pop.id_copy.click',
        gaClickName: 'dc.bucket.b_detail_pop.id.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        label: 'Primary SP address',
        value: editDetail?.primary_sp_address || '--',
        display: editDetail?.primary_sp_address ? formatAddress(editDetail.primary_sp_address) : '--',
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        value: bucket.payment_address,
        display: formatAddress(bucket.payment_address),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        gaClickName: 'dc.bucket.b_detail_pop.payment.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Create transaction hash',
        value: editDetail.create_tx_hash,
        display: formatAddress(editDetail.create_tx_hash),
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
      </>
    );
  };

  const transformedRemainingQuota = useMemo(() => {
    if (!quota) return '--';
    const { freeQuota, readQuota, consumedQuota } = quota;
    const remainingQuota = readQuota + freeQuota - consumedQuota;
    return `${formatBytes(remainingQuota, true)} / ${formatBytes(freeQuota + readQuota)}`;
  }, [quota]);

  useEffect(() => {
    if (!editDetail.bucket_name) return;
    dispatch(setupBucketQuota(editDetail.bucket_name));
  }, [editDetail.bucket_name, dispatch]);

  useAsyncEffect(async () => {
    if (!editDetail.bucket_name || editDetail.primary_sp_address) return;
    const client = await getClient();
    // TODO 优化成从familyId获取，注意报错处理
    const endpoint = await client.sp.getSPUrlByBucket(editDetail.bucket_name);
    const primarySp = allSps.find((sp: SpItem) => sp.endpoint === endpoint) as SpItem;
    dispatch(setEditDetail({
      ...editDetail,
      primary_sp_address: primarySp.operatorAddress
    }));
  }, [editDetail]);

  const onClose = () => {
    dispatch(setEditDetail({} as BucketItem));
  };

  return (
    <DCDrawer isOpen={isOpen} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader>Bucket Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex my={32}>
          <BucketIcon />
          <Box marginLeft={'24px'} flex={1}>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px">
              Name
            </Text>
            <Text fontSize={'14px'} fontWeight={500} wordBreak="break-all">
              {editDetail.bucket_name}
            </Text>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px" marginTop="8px">
              Remaining Quota
            </Text>
            <Text fontSize={'14px'} fontWeight={500} wordBreak="break-all">
              {transformedRemainingQuota}
            </Text>
          </Box>
        </Flex>
        <Divider marginBottom={16} />
        {getContent()}
      </QDrawerBody>
    </DCDrawer>
  );
});
