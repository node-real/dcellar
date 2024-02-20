import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAsyncEffect } from 'ahooks';
import { setBucketStatus, setupBucket } from '@/store/slices/bucket';
import Head from 'next/head';
import {
  GoBack,
  ObjectContainer,
  ObjectName,
  PanelContainer,
  PanelContent,
  SelectedText,
} from '@/modules/object/objects.style';
import { ObjectBreadcrumb } from '@/modules/object/components/ObjectBreadcrumb';
import { dropRight, last } from 'lodash-es';
import { NewObject } from '@/modules/object/components/NewObject';
import { Flex, Tooltip } from '@node-real/uikit';
import { setFolders } from '@/store/slices/object';
import { ObjectList } from '@/modules/object/components/ObjectList';
import React, { useEffect } from 'react';
import { setPrimarySpInfo, SpItem } from '@/store/slices/sp';
import { QuotaCard } from '@/modules/object/components/QuotaCard';
import { setupAccountInfo } from '@/store/slices/accounts';
import { InsufficientBalance } from './components/InsufficientBalance';
import { IconFont } from '@/components/IconFont';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { ObjectListFilter } from '@/modules/object/components/ObjectListFilter';
import { ObjectFilterItems } from '@/modules/object/components/ObjectFilterItems';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
  const { bucketInfo, owner } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const { allSps } = useAppSelector((root) => root.sp);
  const router = useRouter();
  const { path } = router.query;
  const items = path as string[];
  const title = last(items)!;
  const [bucketName, ...folders] = items;
  const bucket = bucketInfo[bucketName];

  useEffect(() => {
    dispatch(setFolders({ bucketName, folders }));
    return () => {
      dispatch(setFolders({ bucketName: '', folders: [] }));
    };
  }, [bucketName, dispatch, folders]);

  useAsyncEffect(async () => {
    if (!bucket) return;
    // 1. Save cur bucket primary sp info.
    const sp = allSps.find((item) => +item.id === +bucket.Vgf.PrimarySpId) as SpItem;
    dispatch(setPrimarySpInfo({ bucketName, sp }));
    // 2. Set cur bucket payment account info.
    dispatch(setupAccountInfo(bucket.PaymentAddress));
  }, [bucket, bucketName]);

  useAsyncEffect(async () => {
    const bucket = bucketInfo[bucketName];
    if (bucket) {
      const Owner = bucket.Owner;
      const payload = {
        discontinue: bucket.BucketStatus === 1,
        owner: Owner === loginAccount,
      };
      dispatch(setBucketStatus(payload));
      return;
    }
    const error = await dispatch(setupBucket(bucketName, loginAccount));
    if (!error) return;
    await router.replace('/no-bucket?err=noBucket');
  }, [bucketName, dispatch]);

  const selected = selectedRowKeys.length;

  const goBack = () => {
    const path = dropRight(items).map(encodeURIComponent).join('/');
    router.push(`/buckets/${path}`);
  };

  return (
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
          {owner && <QuotaCard />}
        </Flex>
        <PanelContent>
          <ObjectListFilter />
          <NewObject
            showRefresh={true}
            gaFolderClickName="dc.file.list.create_folder.click"
            gaUploadClickName="dc.file.list.upload.click"
          />
        </PanelContent>
      </PanelContainer>

      <ObjectFilterItems />

      {owner ? (
        <InsufficientBalance />
      ) : (
        <DiscontinueBanner
          bg={'#FDF9E7'}
          color={'#1E2026'}
          icon={<IconFont w={16} type={'colored-info'} color={'#EEBE11'} />}
          content="You are browsing a bucket created by someone else. Certain functions may be restricted."
        />
      )}

      <ObjectList />
    </ObjectContainer>
  );
};
