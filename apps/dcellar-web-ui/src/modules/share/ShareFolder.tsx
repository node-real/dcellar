import { IQuotaProps } from '@bnb-chain/greenfield-js-sdk';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Flex, Text } from '@node-real/uikit';
import { useUnmount } from 'ahooks';
import { trimEnd } from 'lodash-es';
import { useRouter } from 'next/router';
import { memo, useEffect } from 'react';

import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { DCLink } from '@/components/common/DCLink';
import { IconFont } from '@/components/IconFont';
import { CreateObject } from '@/modules/object/components/CreateObject';
import { ObjectBreadcrumb } from '@/modules/object/components/ObjectBreadcrumb';
import { ObjectFilterItems } from '@/modules/object/components/ObjectFilterItems';
import { ObjectList } from '@/modules/object/components/ObjectList';
import { ObjectListFilter } from '@/modules/object/components/ObjectListFilter';
import { PanelContent } from '@/modules/object/objects.style';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupBucket } from '@/store/slices/bucket';
import { setPathSegments, setObjectShareModePath } from '@/store/slices/object';
import { SpEntity } from '@/store/slices/sp';
import { decodeObjectName } from '@/utils/string';

interface ShareFolderProps {
  fileName: string;
  quotaData: IQuotaProps;
  loginAccount: string;
  primarySp: SpEntity;
}

const headerDropDown = css`
  body .header-avatar-dropdown {
    right: 285px;
  }
`;

export const ShareFolder = memo<ShareFolderProps>(function ShareFolder({ fileName }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const objectShareModePath = useAppSelector((root) => root.object.objectShareModePath);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);

  const { file } = router.query;
  const prefix = decodeObjectName(objectShareModePath || (file as string));
  const items = trimEnd(prefix, '/').split('/');
  const [bucketName, ...folders] = items;
  const info = objectRecords[prefix];
  const bucket = bucketRecords[bucketName];
  const omitLen = (file as string).split('/').length;

  const hash = fileName
    ? `${GREENFIELD_CHAIN_EXPLORER_URL}/tx/${info?.CreateTxHash}`
    : `${GREENFIELD_CHAIN_EXPLORER_URL}/tx/${bucket?.CreateTxHash}`;

  useEffect(() => {
    dispatch(setPathSegments({ bucketName, folders }));
    return () => {
      dispatch(setPathSegments({ bucketName: '', folders: [] }));
    };
  }, [prefix, objectShareModePath, dispatch]);

  useEffect(() => {
    if (!fileName && bucketName) {
      dispatch(setupBucket(bucketName));
    }
  }, [bucketName, fileName, dispatch]);

  useUnmount(() => {
    dispatch(setObjectShareModePath(''));
  });

  return (
    <Box maxW={'calc(100% - 40px)'} minH={'100%'} w={'100%'}>
      <Global styles={headerDropDown} />
      <Container>
        <Flex alignItems={'center'} gap={24} p={24} bg={'#FAFAFA'}>
          <IconFont w={64} type={'detail-folder'} />
          <Text fontSize={16} fontWeight={600} flex={1}>
            {fileName || bucketName}
          </Text>
          <DCLink
            color={'#474D57'}
            target={'_blank'}
            display={'flex'}
            alignItems={'center'}
            alignSelf={'start'}
            href={hash}
          >
            Check on Explorer <IconFont type={'external'} w={14} />
          </DCLink>
        </Flex>
        <Content>
          <Flex justifyContent="space-between" alignItems="center">
            <ObjectBreadcrumb hideLeft={omitLen - 2} />
          </Flex>
          <PanelContent>
            <ObjectListFilter />
            <CreateObject
              shareMode
              showRefresh={true}
              gaFolderClickName="dc.file.list.create_folder.click"
              gaUploadClickName="dc.file.list.upload.click"
            />
          </PanelContent>
          <Box h={16} />
          <ObjectFilterItems />
          <ObjectList shareMode />
        </Content>
      </Container>
    </Box>
  );
});

const Content = styled.div`
  padding: 24px;
  border-top: 1px solid #e6e8ea;
`;

const Container = styled.div`
  border: 1px solid #e6e8ea;
  margin-top: 24px;
`;
