import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { DEFAULT_TAG } from '@/components/common/ManageTags';
import { IconFont } from '@/components/IconFont';
import { SharePermission } from '@/modules/object/components/SharePermission';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBucketOperation,
  setBucketTagsEditData,
  setBucketEditQuota,
  setupBucketQuota,
  TBucket,
} from '@/store/slices/bucket';
import { selectBucketSp } from '@/store/slices/sp';
import { convertObjectKey } from '@/utils/common';
import { formatAddress, formatId, formatQuota, trimAddress } from '@/utils/string';
import { formatFullTime, getMillisecond } from '@/utils/time';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
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
} from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import dayjs from 'dayjs';
import { memo, PropsWithChildren, useEffect } from 'react';

export const Label = ({ children }: PropsWithChildren) => (
  <Text fontSize={'14px'} fontWeight={500} color="readable.tertiary">
    {children}
  </Text>
);

interface DetailBucketOperationProps {
  selectedBucketInfo: TBucket;
}

export const defaultNullObject: ObjectMeta = {
  ObjectInfo: {
    ObjectName: '',
    PayloadSize: 0,
    Visibility: 3,
    ObjectStatus: 1,
  } as any,
  LockedBalance: '',
  Removed: false,
  UpdateAt: 0,
  DeleteAt: 0,
  DeleteReason: '',
  Operator: '',
  CreateTxHash: '',
  UpdateTxHash: '',
  SealTxHash: '',
};

export const DetailBucketOperation = memo<DetailBucketOperationProps>(function DetailDrawer({
  selectedBucketInfo,
}) {
  const dispatch = useAppDispatch();
  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const primarySp = useAppSelector(selectBucketSp(selectedBucketInfo))!;

  const bucketQuota = bucketQuotaRecords[selectedBucketInfo.BucketName];
  const endDate = dayjs().utc?.().endOf('month').format('D MMM, YYYY');
  const formattedQuota = formatQuota(bucketQuota);
  const nullObjectMeta: ObjectMeta = {
    ...defaultNullObject,
    ObjectInfo: {
      ...defaultNullObject.ObjectInfo,
      BucketName: selectedBucketInfo.BucketName,
    },
  };

  const onEditTags = () => {
    const tags = selectedBucketInfo.Tags.Tags.map((item) =>
      convertObjectKey(item, 'lowercase'),
    ) as ResourceTags_Tag[];
    dispatch(setBucketTagsEditData(tags));
    dispatch(
      setBucketOperation({ level: 1, operation: [selectedBucketInfo.BucketName, 'update_tags'] }),
    );
  };

  const onManageQuota = () => {
    dispatch(setBucketEditQuota([selectedBucketInfo.BucketName, 'drawer']));
  };

  const onManagePaymentAccount = () => {
    dispatch(
      setBucketOperation({
        level: 1,
        operation: [selectedBucketInfo.BucketName, 'payment_account'],
      }),
    );
  };

  const getContent = () => {
    const CreateAt = getMillisecond(selectedBucketInfo.CreateAt);
    const spName = primarySp.moniker;
    const payAccountName = accountInfos[selectedBucketInfo.PaymentAddress]?.name;
    const infos = [
      {
        canCopy: false,
        edit: false,
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
        edit: true,
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
        edit: false,
        label: 'Bucket ID',
        value: formatId(Number(selectedBucketInfo.Id)),
        display: formatAddress(formatId(Number(selectedBucketInfo.Id))),
        copyGaClickName: 'dc.bucket.b_detail_pop.id_copy.click',
        gaClickName: 'dc.bucket.b_detail_pop.id.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/bucket`,
      },
      {
        canCopy: true,
        edit: false,
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
            h={24}
            _notLast={{
              mb: 8,
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
                    {item.edit && (
                      <Flex
                        alignItems={'center'}
                        gap={4}
                        color={'brand.brand6'}
                        cursor={'pointer'}
                        onClick={onManagePaymentAccount}
                        w={16}
                        h={16}
                      >
                        <IconFont type="pen" />
                      </Flex>
                    )}
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
          h={24}
          _notLast={{
            mb: 8,
          }}
        >
          <Label>Tags</Label>
          <Flex>
            <Flex
              alignItems={'center'}
              gap={4}
              color={'brand.brand6'}
              cursor={'pointer'}
              onClick={onEditTags}
            >
              <IconFont type="pen" />
              {selectedBucketInfo.Tags.Tags.length || 0} tags
            </Flex>
          </Flex>
        </Flex>
        <Flex
          justifyContent={'space-between'}
          color="readable.tertiary"
          alignItems="center"
          h={24}
          _notLast={{
            mb: 8,
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
          h={42}
          pt={4}
          _notLast={{
            mb: 8,
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
            <Text fontSize={12} color="readable.disable">
              Expire date: {endDate}
            </Text>
          </Flex>
        </Flex>
      </>
    );
  };

  useEffect(() => {
    dispatch(setupBucketQuota(selectedBucketInfo.BucketName));
  }, [selectedBucketInfo.BucketName, dispatch]);

  useUnmount(() => dispatch(setBucketTagsEditData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader>Bucket Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mb={24}>
          <IconFont type="detail-bucket" w={120} />
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
                onClick={onManageQuota}
              >
                Increase Quota
              </Text>
            </Text>
          </Box>
        </Flex>
        <Divider mb={24} />
        {getContent()}
        <Divider mb={24} mt={8} />
        <SharePermission selectObjectInfo={nullObjectMeta} />
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton size="lg" w={'100%'} onClick={onManageQuota}>
          Manage Quota
        </DCButton>
      </QDrawerFooter>
    </>
  );
});
