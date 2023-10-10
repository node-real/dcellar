import { Empty, Flex, QListItem, Text } from '@totejs/uikit';
import React, { useMemo } from 'react';
import { removeFromWaitQueue } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';
import { isEmpty } from 'lodash-es';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { IconFont } from '@/components/IconFont';

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
        <IconFont type="empty-object" w={120} />
        <Text color="readable.secondary" my={16} fontSize={16} fontWeight={500}>
          There are no objects in the list.
        </Text>
      </Empty>
    );
  }
  return (
    <Flex width="100%" flexDirection={'column'} alignItems={'center'} display={'flex'}>
      {list?.map((selectedFile) => (
        <QListItem
          key={selectedFile.id}
          cursor={'default'}
          maxW={'520px'}
          h={42}
          px={0}
          _hover={{
            bg: 'opacity1',
          }}
          right={
            <IconFont
              onClick={() => onRemoveClick(selectedFile.id)}
              w={16}
              type="close"
              cursor="pointer"
              color={'readable.secondary'}
              _hover={{
                color: 'readable.normal',
              }}
            />
          }
        >
          <Flex fontSize={'12px'} alignItems={'center'} justifyContent={'space-between'}>
            <NameItem
              w={240}
              mr={12}
              name={selectedFile.name}
              msg={selectedFile.msg}
              size={selectedFile.size}
            />
            <PathItem
              lineHeight="normal"
              path={`${path}/${selectedFile.relativePath ? selectedFile.relativePath + '/' : ''}`}
              textAlign="left"
            />
          </Flex>
        </QListItem>
      ))}
    </Flex>
  );
};
