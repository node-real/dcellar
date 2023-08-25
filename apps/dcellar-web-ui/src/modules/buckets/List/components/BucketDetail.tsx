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
import { GAClick } from '@/components/common/GATracker';

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
    const CreateAt = getMillisecond(rowData.CreateAt);
    const infos = [
      {
        canCopy: false,
        label: 'Date Created',
        value: formatFullTime(CreateAt) || new Date(),
        display: formatFullTime(CreateAt),
        href: '',
      },
      {
        canCopy: true,
        label: 'Bucket ID',
        value: formatId(rowData.originalData.BucketInfo.id || ''),
        display: formatAddress(formatId(rowData.originalData.BucketInfo.id || '')),
        copyGaClickName: 'dc.bucket.b_detail_pop.id_copy.click',
        gaClickName: 'dc.bucket.b_detail_pop.id.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        label: 'Primary SP address',
        value: rowData.originalData.BucketInfo.PrimarySpAddress || '',
        display: formatAddress(rowData.originalData.BucketInfo.PrimarySpAddress || ''),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        label: 'Payment address',
        value: rowData.originalData.BucketInfo.PaymentAddress || '',
        display: formatAddress(rowData.originalData.BucketInfo.PaymentAddress || ''),
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_payment.click',
        gaClickName: 'dc.bucket.b_detail_pop.payment.click',
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
              {rowData.BucketName}
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
