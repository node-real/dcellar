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
import { last } from 'lodash-es';
import { NewObject } from '@/modules/object/components/NewObject';
import { Tooltip } from '@totejs/uikit';
import { selectObjectList, setFolders } from '@/store/slices/object';
import { ObjectList } from '@/modules/object/components/ObjectList';
import { useEffect } from 'react';

export const ObjectsPage = () => {
  const dispatch = useAppDispatch();
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
  }, [bucketName, folders, dispatch]);

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
    const error = dispatch(setupBucket(bucketName, loginAccount));
    if (!error) return;
    // todo refactor
    // await router.replace('/no-bucket?err=noBucket');
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
