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
import { Flex, Tooltip } from '@totejs/uikit';
import { setFolders } from '@/store/slices/object';
import { ObjectList } from '@/modules/object/components/ObjectList';
import React, { useEffect } from 'react';
import { getPrimarySpInfo } from '@/store/slices/sp';
import { QuotaCard } from '@/modules/object/components/QuotaCard';
import { setupAccountDetail } from '@/store/slices/accounts';
import { InsufficientBalance } from './components/InsufficientBalance';
import { IconFont } from '@/components/IconFont';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
  const { bucketInfo, owner } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
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
    // 1. set global primary sp info
    const sp = await dispatch(getPrimarySpInfo(bucketName, +bucket.GlobalVirtualGroupFamilyId));
    // 2. set payment account infos
    dispatch(setupAccountDetail(bucket.PaymentAddress));
  }, [bucket, bucketName]);

  useAsyncEffect(async () => {
    const bucket = bucketInfo[bucketName];
    if (bucket) {
      const Owner = bucket.Owner;
      const payload = {
        // @ts-ignore
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
          {owner && <QuotaCard />}
        </Flex>
        <PanelContent>
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
          <NewObject
            showRefresh={true}
            gaFolderClickName="dc.file.list.create_folder.click"
            gaUploadClickName="dc.file.list.upload.click"
          />
        </PanelContent>
      </PanelContainer>
      <InsufficientBalance />
      <ObjectList />
    </ObjectContainer>
  );
};
