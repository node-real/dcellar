import React, { memo, useCallback, useMemo } from 'react';
import FileEmptyIcon from '@/public/images/files/file_empty.svg';
import DiscontinueImg from '@/public/images/files/file_failed.svg';
import { Text } from '@totejs/uikit';

export const FileListEmpty = ({
  bucketStatus,
  folderName,
}: {
  bucketStatus: number;
  folderName: string;
}) => {
  const EmptyIcon = useCallback(() => {
    if (bucketStatus === 1) {
      return <DiscontinueImg w="120px" h="120px" />;
    }
    return <FileEmptyIcon w="120px" h="120px" />;
  }, [bucketStatus]);

  const title = useMemo(() => {
    if (bucketStatus === 1) {
      return 'Discontinue Notice';
    }
    return `Upload your files to this ${folderName ? 'folder' : 'bucket'} right now!👏`;
  }, [bucketStatus, folderName]);

  const subTitle = useMemo(() => {
    if (bucketStatus === 1) {
      return 'This bucket were marked as discontinued and will be deleted by SP soon. ';
    }
    return `(Please make sure your file is smaller than 256MB during testnet phase. \n Please be aware that data loss might occur during testnet phase.)`;
  }, [bucketStatus]);
  return (
    <>
      <EmptyIcon />
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
    </>
  );
};
