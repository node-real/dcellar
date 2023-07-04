import React, { memo } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { ObjectItem } from '@/store/slices/object';
import { useAppSelector } from '@/store';
import { contentIconTypeToExtension } from '@/modules/file/utils';
import { Image, Tooltip } from '@totejs/uikit';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';

interface NameItemProps {
  item: ObjectItem;
}

export const NameItem = memo<NameItemProps>(function NameItem({ item }) {
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
        <Tooltip content={'Everyone can access.'} placement={'bottom-start'}>
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
        href={`/buckets/${bucketName}/${objectName}`}
        onClick={(e) => {
          if (folder) return;
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
    span {
      margin: 0 4px;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
