import { Flex, Tooltip } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { dropRight, last } from 'lodash-es';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { InsufficientBalance } from './components/InsufficientBalance';

import { IconFont } from '@/components/IconFont';
import { CreateObject } from '@/modules/object/components/CreateObject';
import { ObjectBreadcrumb } from '@/modules/object/components/ObjectBreadcrumb';
import { ObjectFilterItems } from '@/modules/object/components/ObjectFilterItems';
import { ObjectList } from '@/modules/object/components/ObjectList';
import { ObjectListFilter } from '@/modules/object/components/ObjectListFilter';
import { QuotaCard } from '@/modules/object/components/QuotaCard';
import {
  GoBack,
  ObjectContainer,
  ObjectName,
  PanelContainer,
  PanelContent,
  SelectedText,
} from '@/modules/object/objects.style';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupAccountRecords, selectPaymentAccounts } from '@/store/slices/accounts';
import { setBucketStatus, setupBucket } from '@/store/slices/bucket';
import { setPathSegments } from '@/store/slices/object';
import { setPrimarySpInfo, SpEntity } from '@/store/slices/sp';
import { GAContextProvider } from '@/context/GAContext';
import { ObjectOperations } from '@/modules/object/components/ObjectOperations';
import { BucketStatus as BucketStatusEnum } from '@bnb-chain/greenfield-js-sdk';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { MigratingBucketNoticeBanner } from './components/MigratingBucketNoticeBanner';
import { RenewalNotification } from '@/components/RenewalNotification';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectSelectedKeys = useAppSelector((root) => root.object.objectSelectedKeys);
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const isBucketMigrating = useAppSelector((root) => root.bucket.isBucketMigrating);
  const paymentAccountList = useAppSelector(selectPaymentAccounts(loginAccount));
  const allSpList = useAppSelector((root) => root.sp.allSpList);
  const ownAccounts = [loginAccount, ...paymentAccountList.map((item) => item.address)];
  const { path } = router.query;
  const items = path as string[];
  const title = last(items)!;
  const [bucketName, ...folders] = items;
  const bucket = bucketRecords[bucketName];
  const isFlowRateLimit = ['1', '3'].includes(bucket?.OffChainStatus);
  const isOwnAccount = ownAccounts.includes(bucket?.PaymentAddress);
  const selected = objectSelectedKeys.length;

  const goBack = () => {
    const path = dropRight(items).map(encodeURIComponent).join('/');
    router.push(`/buckets/${path}`);
  };

  useEffect(() => {
    dispatch(setPathSegments({ bucketName, folders }));
    return () => {
      dispatch(setPathSegments({ bucketName: '', folders: [] }));
    };
  }, [bucketName, dispatch, folders]);

  useAsyncEffect(async () => {
    if (!bucket) return;
    const sp = allSpList.find((item) => +item.id === +bucket.Vgf.PrimarySpId) as SpEntity;
    dispatch(setPrimarySpInfo({ bucketName, sp }));
    dispatch(setupAccountRecords(bucket.PaymentAddress));
  }, [bucket, bucketName]);

  useAsyncEffect(async () => {
    const bucket = bucketRecords[bucketName];
    if (bucket) {
      const Owner = bucket.Owner;
      const payload = {
        isBucketDiscontinue: bucket.BucketStatus === BucketStatusEnum.BUCKET_STATUS_DISCONTINUED,
        isBucketMigrating: bucket.BucketStatus === BucketStatusEnum.BUCKET_STATUS_MIGRATING,
        isBucketOwner: Owner === loginAccount,
      };
      dispatch(setBucketStatus(payload));
      return;
    }
    const error = await dispatch(setupBucket(bucketName, loginAccount));
    if (!error) return;
    await router.replace('/no-bucket?err=noBucket');
  }, [bucketName, dispatch]);

  return (
    <GAContextProvider prefix={'dc.object'}>
      <ObjectContainer>
        <Head>
          <title>{bucketName} - DCellar</title>
        </Head>
        <PanelContainer>
          <Flex justifyContent="space-between" alignItems="center">
            <ObjectBreadcrumb />
          </Flex>
          <Flex my={16} h={49} justifyContent="space-between" alignItems="center">
            <GoBack onClick={goBack}>
              <IconFont type="backward" w={24} />
              {selected > 0 ? (
                <SelectedText>
                  {selected} File{selected > 1 && 's'} Selected
                </SelectedText>
              ) : (
                <Tooltip
                  content={title}
                  placement="bottom-end"
                  visibility={title.length > 40 ? 'visible' : 'hidden'}
                >
                  <ObjectName>{title}</ObjectName>
                </Tooltip>
              )}
            </GoBack>
            {isBucketOwner && <QuotaCard />}
          </Flex>
          <PanelContent>
            <ObjectListFilter />
            <CreateObject
              showRefresh={true}
              gaFolderClickName="dc.file.list.create_folder.click"
              gaUploadClickName="dc.file.list.upload.click"
            />
          </PanelContent>
        </PanelContainer>

        <ObjectFilterItems />

        {isBucketOwner ? (
          <>
            {isOwnAccount ? (
              <RenewalNotification address={bucket?.PaymentAddress} />
            ) : (
              <InsufficientBalance />
            )}
          </>
        ) : (
          <DiscontinueBanner
            bg={'#FDF9E7'}
            color={'#1E2026'}
            icon={<IconFont w={16} type={'colored-info'} color={'#EEBE11'} />}
            content="You are browsing a bucket created by someone else. Certain functions may be restricted."
          />
        )}
        {isFlowRateLimit && isBucketOwner && (
          <DiscontinueBanner content="The bucket's flow rate exceeds the payment account limit. Contact the account owner or switch accounts to increase it." />
        )}
        {isBucketDiscontinue && isBucketOwner && (
          <DiscontinueBanner content="All the items in this bucket were marked as discontinued and will be deleted by SP soon. Please backup your data in time. " />
        )}
        {isBucketMigrating && isBucketOwner && (
          <MigratingBucketNoticeBanner bucketName={bucket.BucketName} />
        )}
        <ObjectOperations />

        <ObjectList />
      </ObjectContainer>
    </GAContextProvider>
  );
};
