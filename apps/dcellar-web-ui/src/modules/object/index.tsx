import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAsyncEffect } from 'ahooks';
import { setBucketStatus, setupBucket } from '@/store/slices/bucket';
import Head from 'next/head';
import {
  ObjectContainer,
  ObjectName,
  PanelContainer,
  PanelContent,
} from '@/modules/object/objects.style';
import { ObjectBreadcrumb } from '@/modules/object/components/ObjectBreadcrumb';
import { isEmpty, last } from 'lodash-es';
import { NewObject } from '@/modules/object/components/NewObject';
import { Text, Tooltip } from '@totejs/uikit';
import {
  selectObjectList,
  setFolders,
  setPrimarySp,
  setSelectedRowKeys,
} from '@/store/slices/object';
import { ObjectList } from '@/modules/object/components/ObjectList';
import React, { useEffect } from 'react';
import { SpItem } from '@/store/slices/sp';
import { BatchOperations } from '@/modules/object/components/BatchOperations';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
  const { spInfo } = useAppSelector((root) => root.sp);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const selectedRowKeys = useAppSelector((root) => root.object.selectedRowKeys);
  const objectList = useAppSelector(selectObjectList);
  const router = useRouter();
  const { path } = router.query;
  const items = path as string[];
  const title = last(items)!;
  const [bucketName, ...folders] = items;

  useEffect(() => {
    dispatch(setFolders({ bucketName, folders }));
    return () => {
      dispatch(setFolders({ bucketName: '', folders: [] }));
    };
  }, [bucketName, dispatch, folders]);

  useEffect(() => {
    const primarySp = spInfo[bucketInfo[bucketName]?.primary_sp_address];
    !isEmpty(primarySp) && dispatch(setPrimarySp(primarySp));

    return () => {
      !isEmpty(primarySp) && dispatch(setPrimarySp({} as SpItem));
    };
  }, [bucketName, folders, dispatch, spInfo, bucketInfo]);

  useAsyncEffect(async () => {
    const bucket = bucketInfo[bucketName];
    if (bucket) {
      const payload = {
        discontinue: bucket.bucket_status === 1,
        owner: bucket.owner === loginAccount,
      };
      dispatch(setBucketStatus(payload));
      return;
    }
    const error = await dispatch(setupBucket(bucketName, loginAccount));
    if (!error) return;
    await router.replace('/no-bucket?err=noBucket');
  }, [bucketName, dispatch]);

  const selected = selectedRowKeys.length;

  return (
    <ObjectContainer>
      <Head>
        <title>{bucketName} - DCellar</title>
      </Head>
      <PanelContainer>
        <ObjectBreadcrumb />
        <PanelContent>
          {selected > 0 ? (
            <BatchOperations />
          ) : (
            <Tooltip
              content={title}
              placement="bottom-end"
              visibility={title.length > 40 ? 'visible' : 'hidden'}
            >
              <ObjectName>{title}</ObjectName>
            </Tooltip>
          )}

          {!!objectList.length && (
            <NewObject
              gaFolderClickName="dc.file.list.create_folder.click"
              gaUploadClickName="dc.file.list.upload.click"
            />
          )}
        </PanelContent>
      </PanelContainer>
      <ObjectList />
    </ObjectContainer>
  );
};
