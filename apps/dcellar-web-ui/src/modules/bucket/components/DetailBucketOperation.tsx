import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { IconFont } from '@/components/IconFont';
import { SharePermission } from '@/modules/object/components/SharePermission';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setBucketOperation,
  setBucketTagsEditData,
  setBucketEditQuota,
  setupBucketQuota,
  TBucket,
  setupBucketActivity,
  BucketOperationsType,
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
  Fade,
  Flex,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  toast,
} from '@node-real/uikit';
import dayjs from 'dayjs';
import { memo, PropsWithChildren, useEffect, useState } from 'react';
import { useMount, useUnmount } from 'ahooks';
import { DEFAULT_TAG } from '@/components/common/ManageTags';
import { Activities } from '@/components/Activities';
import { BucketStatus } from '@bnb-chain/greenfield-js-sdk';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';

export const Label = ({ children }: PropsWithChildren) => (
  <Text as={'div'} fontSize={'14px'} fontWeight={500} color="readable.tertiary">
    {children}
  </Text>
);

const VERSION_TABS = ['General Info', 'Activities'];

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
  const bucketActivityRecords = useAppSelector((root) => root.bucket.bucketActivityRecords);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const primarySp = useAppSelector(selectBucketSp(selectedBucketInfo))!;

  const [quotaDetailVisible, setQuotaDetailVisible] = useState(false);
  const bucketQuota = bucketQuotaRecords[selectedBucketInfo.BucketName];
  const endDate = dayjs().utc?.().endOf('month').format('D MMM, YYYY');
  const formattedQuota = formatQuota(bucketQuota);

  const activityKey = selectedBucketInfo.BucketName;
  const loading = !(activityKey in bucketActivityRecords);
  const bucketActivities = bucketActivityRecords[activityKey];

  const nullObjectMeta: ObjectMeta = {
    ...defaultNullObject,
    ObjectInfo: {
      ...defaultNullObject.ObjectInfo,
      BucketName: selectedBucketInfo.BucketName,
    },
  };

  const isFlowRateLimit = ['1', '3'].includes(selectedBucketInfo?.OffChainStatus);
  const isBucketDiscontinue =
    selectedBucketInfo.BucketStatus === BucketStatus.BUCKET_STATUS_DISCONTINUED;
  const isBucketMigrating =
    selectedBucketInfo.BucketStatus === BucketStatus.BUCKET_STATUS_MIGRATING;

  const quotaDetail = [
    {
      key: 'Monthly quota',
      quota: formattedQuota.totalReadText,
      expired: endDate,
      remain: formattedQuota.remainReadText,
    },
    ...(formattedQuota.monthlyFreeQuota
      ? [
          {
            key: 'Free monthly quota',
            quota: formattedQuota.monthlyFreeQuotaText,
            expired: endDate,
            remain: formattedQuota.monthlyQuotaRemainText,
          },
        ]
      : []),
    ...(formattedQuota.oneTimeFree
      ? [
          {
            key: 'Free quota (one-time)',
            quota: formattedQuota.oneTimeFreeText,
            expired: '',
            remain: formattedQuota.oneTimeFreeRemainText,
          },
        ]
      : []),
  ];

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

  const getContent = () => {
    const CreateAt = getMillisecond(selectedBucketInfo.CreateAt);
    const spName = primarySp.moniker;
    const payAccountName = accountInfos[selectedBucketInfo.PaymentAddress]?.name;
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
        edit: 'migrate',
        editDisabled: [
          BucketStatus.BUCKET_STATUS_MIGRATING,
          BucketStatus.BUCKET_STATUS_DISCONTINUED,
        ].includes(selectedBucketInfo.BucketStatus),
        name: spName,
        operation: 'payment_account',
        value: primarySp.operatorAddress || '--',
        display: primarySp.operatorAddress ? trimAddress(primarySp.operatorAddress) : '--',
        copyGaClickName: 'dc.bucket.b_detail_pop.copy_spadd.click',
        gaClickName: 'dc.bucket.b_detail_pop.spadd.click',
        href: `${GREENFIELD_CHAIN_EXPLORER_URL}/account`,
      },
      {
        canCopy: true,
        edit: 'payment_account',
        editDisabled: [
          BucketStatus.BUCKET_STATUS_MIGRATING,
          BucketStatus.BUCKET_STATUS_DISCONTINUED,
        ].includes(selectedBucketInfo.BucketStatus),
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
                        color={item.editDisabled ? 'readable.disable' : 'brand.brand6'}
                        cursor={item.editDisabled ? 'not-allowed' : 'pointer'}
                        onClick={() =>
                          !item.editDisabled && onEditClick(item.edit as BucketOperationsType)
                        }
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
          <Label>
            <Flex
              as={'span'}
              cursor={'pointer'}
              alignItems={'center'}
              onClick={() => setQuotaDetailVisible((v) => !v)}
            >
              Total quota{' '}
              <IconFont type={quotaDetailVisible ? 'menu-open' : 'menu-close'} w={16} ml={4} />
            </Flex>
          </Label>
          <Flex>
            <Text fontSize={'14px'} fontWeight={500} color="readable.normal">
              {formattedQuota.totalText}{' '}
              <Text as="span" color="#76808F">
                ({formattedQuota.remainText} remains)
              </Text>
            </Text>
          </Flex>
        </Flex>
        <Fade in={quotaDetailVisible} unmountOnExit>
          <Flex
            flexDirection={'column'}
            my={12}
            borderRadius={4}
            border={'1px solid readable.border'}
          >
            {quotaDetail.map((detail, index) => (
              <Flex
                key={index}
                borderBottom={'1px solid readable.border'}
                h={42}
                sx={{
                  '&:last-of-type': { borderBottom: 'none' },
                }}
                alignItems={'center'}
              >
                <Text w={200} px={12} fontWeight={500} color={'readable.tertiary'}>
                  {detail.key}
                </Text>
                <Text as={'div'} w={200}>
                  {detail.expired ? (
                    <Box>
                      <Text fontWeight={500}>{detail.quota}/mo</Text>
                      <Text mt={2} fontSize={12} color={'readable.disable'}>
                        Expire date: {detail.expired}
                      </Text>
                    </Box>
                  ) : (
                    <Text fontWeight={500}>{detail.quota}</Text>
                  )}
                </Text>
                <Text w={120} color={'readable.tertiary'}>
                  {detail.remain} remains
                </Text>
              </Flex>
            ))}
          </Flex>
        </Fade>
      </>
    );
  };

  const onEditClick = (operation?: BucketOperationsType) => {
    switch (operation) {
      case 'payment_account':
        dispatch(
          setBucketOperation({
            level: 1,
            operation: [selectedBucketInfo.BucketName, 'payment_account'],
          }),
        );
        break;
      case 'migrate':
        if (selectedBucketInfo.BucketStatus === BucketStatus.BUCKET_STATUS_MIGRATING) {
          toast.error({ description: 'The bucket is migrating, please wait.' });
        } else {
          dispatch(
            setBucketOperation({
              level: 1,
              operation: [selectedBucketInfo.BucketName, 'migrate'],
            }),
          );
        }
        break;
    }
  };
  useEffect(() => {
    dispatch(setupBucketQuota(selectedBucketInfo.BucketName));
  }, [selectedBucketInfo.BucketName, dispatch]);

  useMount(() => {
    dispatch(setupBucketActivity(selectedBucketInfo.BucketName, selectedBucketInfo.Id));
  });

  useUnmount(() => dispatch(setBucketTagsEditData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader>Bucket Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mb={16}>
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
        {isFlowRateLimit && (
          <DiscontinueBanner
            marginBottom={16}
            content="The bucket's flow rate exceeds the payment account limit."
          />
        )}
        {isBucketDiscontinue && (
          <DiscontinueBanner
            marginBottom={16}
            content="All discontinued items in this bucket will be deleted by SP soon."
          />
        )}
        {isBucketMigrating && (
          <DiscontinueBanner
            icon={<IconFont w={16} type={'migrate'} color={'#1184EE'} />}
            color={'#1184EE'}
            bg="opacity7"
            marginBottom={16}
            content="This bucket is in the process of data migration to another provider."
          />
        )}
        <Tabs>
          <TabList mb={24}>
            {VERSION_TABS.map((tab) => (
              <Tab h={24} key={tab} fontSize={14} fontWeight={500} pb={8}>
                {tab}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            <TabPanel>
              {getContent()}
              <Divider mb={24} mt={8} />
              <SharePermission selectObjectInfo={nullObjectMeta} />
            </TabPanel>
            <TabPanel>
              <Activities loading={loading} activities={bucketActivities} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton size="lg" w={'100%'} onClick={onManageQuota}>
          Manage Quota
        </DCButton>
      </QDrawerFooter>
    </>
  );
});
