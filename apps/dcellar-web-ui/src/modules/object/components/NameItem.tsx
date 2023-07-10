import React, { memo } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { ObjectItem, setCurrentObjectPage } from '@/store/slices/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { contentIconTypeToExtension } from '@/modules/file/utils';
import { Image, Tooltip } from '@totejs/uikit';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { encodeObjectName } from '@/utils/string';
import { trimEnd } from 'lodash-es';

interface NameItemProps {
  item: ObjectItem;
}

export const NameItem = memo<NameItemProps>(function NameItem({ item }) {
  const dispatch = useAppDispatch();
  const { folder, objectName, name, visibility } = item;
  const { bucketName } = useAppSelector((root) => root.object);
  const fileType = contentIconTypeToExtension(objectName);
  const icon = (
    <Image
      src={`/images/files/icons/${fileType.toLocaleLowerCase()}.svg`}
      alt={fileType}
      width={24}
      height={24}
    />
  );
  const content = (
    <>
      {icon} <span title={name}>{name}</span>
      {visibility === 1 && !folder && (
        <Tooltip content={'Public'} placement={'bottom-start'}>
          <span className="access-icon">
            <PublicFileIcon fillColor="currentColor" />
          </span>
        </Tooltip>
      )}
    </>
  );

  return (
    <Container>
      <Link
        href={`/buckets/${bucketName}/${encodeObjectName(objectName)}`}
        onClick={(e) => {
          if (folder) {
            const path = trimEnd([bucketName, objectName].join('/'), '/');
            dispatch(setCurrentObjectPage({ path, current: 0 }));
            return;
          }
          e.preventDefault();
        }}
      >
        {content}
      </Link>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;
  .access-icon {
    flex-shrink: 0;
  }
  svg {
    pointer-events: none;
    width: 24px;
  }
  a {
    display: flex;
    align-items: center;
    min-width: 0;
    svg {
      flex-shrink: 0;
    }
    span:first-of-type {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
