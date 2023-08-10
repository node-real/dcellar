import { Empty, EmptyDescription, Flex, QListItem, Image } from '@totejs/uikit';
import React, { useMemo } from 'react';
import { CloseIcon} from '@totejs/icons';
import { removeFromWaitQueue } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';
import { UPLOAD_TASK_EMPTY_ICON } from '../file/constant';
import { isEmpty } from 'lodash-es';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';

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

  if (isEmpty(list)) {
    return (
      <Empty>
        <Image alt="Empty" src={UPLOAD_TASK_EMPTY_ICON} width={'100px'} marginBottom={16} />
        {/* <EmptyTitle>Title</EmptyTitle> */}
        <EmptyDescription color="readable.secondary">
          There are no objects in the list.
        </EmptyDescription>
      </Empty>
    );
  }
  return (
    <Flex width="100%" flexDirection={'column'} alignItems={'center'} display={'flex'}>
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
                color="readable.tertiary"
                w="16px"
              />
            }
          >
            <Flex fontSize={'12px'} alignItems={'center'} justifyContent={'space-between'}>
              <NameItem
                w={300}
                mr={12}
                name={selectedFile.name}
                msg={selectedFile.msg}
                size={selectedFile.size}
              />
              <PathItem path={`${path}/${selectedFile.relativePath ? selectedFile.relativePath : '/'}`} textAlign="left" />
            </Flex>
          </QListItem>
        ))}
    </Flex>
  );
};
