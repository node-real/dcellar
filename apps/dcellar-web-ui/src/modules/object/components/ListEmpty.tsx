import React, { memo } from 'react';
import FileEmptyIcon from '@/public/images/files/file_empty.svg';
import DiscontinueImg from '@/public/images/icons/discontinue.svg';
import { Text } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { last } from 'lodash-es';
import styled from '@emotion/styled';
import { NewObject } from '@/modules/object/components/NewObject';

interface ListEmptyProps {
  empty: boolean;
}

export const ListEmpty = memo<ListEmptyProps>(function ListEmpty({ empty }) {
  const { discontinue, owner } = useAppSelector((root) => root.bucket);
  const { bucketName, folders } = useAppSelector((root) => root.object);
  const items = [bucketName, ...folders];
  const lastItem = last(items);

  const EmptyIcon = discontinue ? (
    <DiscontinueImg w="120px" h="120px" />
  ) : (
    <FileEmptyIcon w="120px" h="120px" />
  );

  const title = discontinue
    ? 'Discontinue Notice'
    : `Upload your objects to this ${lastItem} ${folders.length ? 'folder' : 'bucket'} right now!👏`;

  const subTitle = discontinue
    ? 'This bucket were marked as discontinued and will be deleted by SP soon. '
    : `(Please make sure your object is smaller than 256MB during testnet phase. \n Please be aware that data loss might occur during testnet phase.)`;

  return (
    <Container>
      <Content>
        {empty && (
          <>
            {EmptyIcon}
            <Text
              fontSize="18px"
              lineHeight="22px"
              fontWeight={500}
              mt={'16px'}
              color={'readable.secondary'}
            >
              {title}
            </Text>
            <Text
              fontSize="12px"
              lineHeight="16px"
              fontWeight={400}
              mt={'4px'}
              mb={'24px'}
              color={'readable.tertiary'}
              textAlign={'center'}
            >
              {subTitle}
            </Text>
            {!discontinue && owner && (
              <NewObject
                gaFolderClickName="dc.file.empty.create_folder.click"
                gaUploadClickName="dc.file.empty.upload.click"
              />
            )}
          </>
        )}
      </Content>
    </Container>
  );
});

const Content = styled.div`
  display: grid;
  place-items: center;
  max-width: 568px;
`;

const Container = styled.div`
  height: 530px;
  display: grid;
  place-items: center;
`;
