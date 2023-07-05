import React, { memo } from 'react';
import { useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import { Flex, Text, Tooltip } from '@totejs/uikit';
import UploadIcon from '@/public/images/files/upload_transparency.svg';

interface NewObjectProps {
  gaFolderClickName?: string;
  gaUploadClickName?: string;
}

const MAX_FOLDER_LEVEL = 10;
const MAX_FOLDER_NAME_LEN = 70;

export const NewObject = memo<NewObjectProps>(function NewObject({
  gaFolderClickName = '',
  gaUploadClickName = '',
}) {
  const { discontinue, owner } = useAppSelector((root) => root.bucket);
  const { folders } = useAppSelector((root) => root.object);

  if (!owner) return <></>;

  const invalidPath = folders.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN);
  const maxFolderDepth = invalidPath || folders.length >= MAX_FOLDER_LEVEL;

  const disabled = maxFolderDepth || discontinue;
  const uploadDisabled = discontinue || invalidPath || folders.length > MAX_FOLDER_LEVEL;

  return (
    <Flex gap={12}>
      <Tooltip
        content={`You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`}
        placement={'bottom-start'}
        visibility={maxFolderDepth ? 'visible' : 'hidden'}
      >
        <GAClick name={gaFolderClickName}>
          <Flex
            bgColor={disabled ? 'readable.tertiary' : 'readable.normal'}
            _hover={{ bg: 'readable.tertiary' }}
            position="relative"
            paddingX="16px"
            paddingY="8px"
            alignItems="center"
            borderRadius={'8px'}
            cursor={disabled ? 'default' : 'pointer'}
          >
            <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
              Create Folder
            </Text>
          </Flex>
        </GAClick>
      </Tooltip>
      <Tooltip
        placement="bottom-end"
        content={
          discontinue ? 'Bucket in the discontinue status cannot upload files.' : 'Path invalid'
        }
        visibility={uploadDisabled ? 'visible' : 'hidden'}
      >
        <GAClick name={gaUploadClickName}>
          <label htmlFor="file-upload" className="custom-file-upload">
            <Flex
              bgColor={uploadDisabled ? '#AEB4BC' : 'readable.brand6'}
              _hover={{ bg: uploadDisabled ? '#AEB4BC' : '#2EC659' }}
              position="relative"
              paddingX="16px"
              paddingY="8px"
              alignItems="center"
              borderRadius={'8px'}
              cursor={uploadDisabled ? 'default' : 'pointer'}
            >
              <UploadIcon color="#fff" w="24px" h="24px" alt="" />
              <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
                Upload
              </Text>
            </Flex>
          </label>
        </GAClick>
      </Tooltip>
    </Flex>
  );
});
