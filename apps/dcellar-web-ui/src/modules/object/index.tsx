import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAsyncEffect, useWhyDidYouUpdate } from 'ahooks';
import { setBucketStatus, setupBucket } from '@/store/slices/bucket';
import Head from 'next/head';
import {
  ObjectContainer,
  ObjectName,
  PanelContainer,
  PanelContent,
} from '@/modules/object/objects.style';
import { ObjectBreadcrumb } from '@/modules/object/components/ObjectBreadcrumb';
import { last } from 'lodash-es';
import { NewObject } from '@/modules/object/components/NewObject';
import { Tooltip } from '@totejs/uikit';
import { selectObjectList, setFolders } from '@/store/slices/object';
import { ObjectList } from '@/modules/object/components/ObjectList';
import { useEffect } from 'react';
import { SpItem, setPrimarySpInfo } from '@/store/slices/sp';
import { getVirtualGroupFamily } from '@/facade/virtual-group';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
  const { allSps, primarySpInfo} = useAppSelector((root) => root.sp);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const { loginAccount } = useAppSelector((root) => root.persist);
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

  useAsyncEffect(async () => {
    const bucket = bucketInfo[bucketName];
    if (!bucket) return;
    const primarySp = primarySpInfo[bucketName];
    if (!primarySp) {
      const [data, error] = await getVirtualGroupFamily({ familyId: bucket.global_virtual_group_family_id });
      const sp = allSps.find((item) => item.id === data?.globalVirtualGroupFamily?.primarySpId) as SpItem;
      dispatch(setPrimarySpInfo({ bucketName, sp}));
    }
  }, [bucketInfo, bucketName])

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

  return (
    <ObjectContainer>
      <Head>
        <title>{bucketName} - DCellar</title>
      </Head>
      <PanelContainer>
        <ObjectBreadcrumb />
        <PanelContent>
          <Tooltip
            content={title}
            placement="bottom-end"
            visibility={title.length > 40 ? 'visible' : 'hidden'}
          >
            <ObjectName>{title}</ObjectName>
          </Tooltip>
          {!!objectList.length && (
            <NewObject
              showRefresh={true}
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
