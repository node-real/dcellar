import {
  Box,
  Flex,
  QListItem,
} from '@totejs/uikit';
import React, { useMemo } from 'react';
import { formatBytes } from '../file/utils';
import { EllipsisText } from '@/components/common/EllipsisText';
import { CloseIcon } from '@totejs/icons';
import { removeFromWaitQueue } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';

type ListItemProps = { path: string; type: 'ALL' | 'WAIT' | 'ERROR' };

export const ListItem = ({ path, type }: ListItemProps) => {
  const dispatch = useAppDispatch();
  const { waitQueue: selectedFiles } = useAppSelector((root) => root.global);
  const onRemoveClick = (id: number) => {
    dispatch(removeFromWaitQueue({ id }));
  };
  const list = useMemo(() => {
    switch (type) {
      case 'ALL':
        return selectedFiles;
      case 'WAIT':
        return selectedFiles.filter((file) => file.status === 'WAIT');
      case 'ERROR':
        return selectedFiles.filter((file) => file.status === 'ERROR');
      default:
        return selectedFiles;
    }
  }, [selectedFiles, type]);

  return (
    <Flex width='100%' flexDirection={'column'} alignItems={'center'} display={'flex'}>
      {list &&
        list.map((selectedFile) => (
          <QListItem
            key={selectedFile.id}
            cursor={'default'}
            maxW={'520px'}
            paddingX={'6px'}
            right={
              <CloseIcon
                onClick={() => onRemoveClick(selectedFile.id)}
                marginLeft={'8px'}
                cursor={'pointer'}
              />
            }
          >
            <Flex fontSize={'12px'} alignItems={'center'} justifyContent={'space-between'}>
              <Box maxW={'300px'}>
                <EllipsisText marginRight={'12px'}>{selectedFile.name}</EllipsisText>
                {selectedFile.msg ? (
                  <EllipsisText color={'red'}>{selectedFile.msg}</EllipsisText>
                ) : (
                  <EllipsisText>{formatBytes(selectedFile.size)}</EllipsisText>
                )}
              </Box>
              <EllipsisText maxW="200px" textAlign={'right'} flex={1}>{`${path}/`}</EllipsisText>
            </Flex>
          </QListItem>
        ))}
    </Flex>
  );
};
