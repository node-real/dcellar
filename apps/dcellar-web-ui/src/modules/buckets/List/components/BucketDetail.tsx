import {
  Box,
  Divider,
  Flex,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Text,
} from '@totejs/uikit';
import React, { useMemo } from 'react';

import BucketIcon from '@/public/images/buckets/bucket-icon.svg';
import { formatAddress } from '../../utils/formatAddress';
import { CopyText } from '@/components/common/CopyText';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { DCModal } from '@/components/common/DCModal';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { formatBytes } from '@/modules/file/utils';
import { formatId } from '@/utils/string';

export const Label = ({ children }: any) => (
  <Text fontSize={'14px'} fontWeight={500} color="readable.tertiary">
    {children}
  </Text>
);

export const BucketDetail = ({ rowData, onClose, isOpen, quotaData }: any) => {
  const Content = useMemo(() => {
    const create_at = getMillisecond(rowData.create_at);
    const infos = [
      {
        canCopy: false,
        label: 'Date created',
        value: formatFullTime(create_at) || new Date(),
        display: formatFullTime(create_at),
        href: '',
      },
      {
        canCopy: true,
        label: 'Bucket ID',
        value: formatId(rowData.originalData.bucket_info.id || ''),
        display: formatAddress(formatId(rowData.originalData.bucket_info.id || '')),
        gaClickName: 'dc.bucket.b_detail_pop.copy_bkid.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        label: 'Primary SP address',
        value: rowData.originalData.bucket_info.primary_sp_address || '',
        display: formatAddress(rowData.originalData.bucket_info.primary_sp_address || ''),
        gaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        value: rowData.originalData.bucket_info.payment_address || '',
        display: formatAddress(rowData.originalData.bucket_info.payment_address || ''),
        gaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
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
                {item.label !== 'Date created' && (
                  <Link
                    target="_blank"
                    color="#1184EE"
                    cursor={'pointer'}
                    textDecoration={'underline'}
                    _hover={{
                      color: '#1184EE',
                    }}
                    href={`${item.href}/${item.value}`}
                    fontSize={'14px'}
                    fontWeight={500}
                  >
                    {item.display}
                  </Link>
                )}

                {item.canCopy && <CopyText value={item.value} gaClickName={item.gaClickName} />}
              </Flex>
            </Flex>
          ))}
      </>
    );
  }, [rowData]);

  const transformedRemainingQuota = useMemo(() => {
    if (!quotaData) return '--';
    const { freeQuota, readQuota, consumedQuota } = quotaData;
    const remainingQuota = readQuota + freeQuota - consumedQuota;
    return `${formatBytes(remainingQuota, true)}/${formatBytes(freeQuota + readQuota)}`;
  }, [quotaData]);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.bucket.b_detail_pop.0.show"
      gaClickCloseName="dc.bucket.b_detail_pop.close.click"
    >
      <ModalCloseButton />

      <ModalHeader>Bucket Detail</ModalHeader>
      <ModalBody mt={0}>
        <Flex my={32}>
          <BucketIcon />
          <Box marginLeft={'24px'} flex={1}>
            <Text color="readable.tertiary" fontSize={'12px'} marginBottom="4px">
              Name
            </Text>
            <Text fontSize={'14px'} fontWeight={500} wordBreak="break-all">
              {rowData.bucket_name}
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
        {Content}
      </ModalBody>
    </DCModal>
  );
};
