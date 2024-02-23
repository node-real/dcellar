import { IconFont } from '@/components/IconFont';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import {
  Box,
  ButtonProps,
  Flex,
  FormControl,
  FormErrorMessage,
  Input,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
} from '@node-real/uikit';
import { useState } from 'react';
import { DCButton } from '../DCButton';

export const DEFAULT_TAG = {
  key: '',
  value: '',
};

export type ManageTagOperationProps = {
  onSave: (updateTags: ResourceTags_Tag[]) => void;
  onCancel: () => void;
  tags: ResourceTags_Tag[];
};

export const ManageTags = ({ onSave, onCancel, tags }: ManageTagOperationProps) => {
  const isInvalid = (type: string, value: string) => {
    if (type === 'key' && value.length > 32) {
      return 'Should not exceed 32 characters.';
    }
    if (type === 'value' && value.length > 64) {
      return 'Should not exceed 64 characters.';
    }

    return false;
  };
  const [internalTags, setInternalTags] = useState(tags);
  const onAddTagItem = () => {
    if (internalTags.length < 4) {
      setInternalTags([...internalTags, DEFAULT_TAG]);
    }
  };
  const onInputChange = (type: 'key' | 'value', value: string, index: number) => {
    const newTags = internalTags.toSpliced(index, 1, {
      ...internalTags[index],
      [type]: value,
    });
    setInternalTags(newTags);
  };
  const onDelete = (index: number) => {
    setInternalTags(internalTags.filter((_, curIndex) => curIndex !== index));
  };

  return (
    <>
      <QDrawerHeader flexDir={'column'}>
        <Flex cursor={'pointer'} alignItems={'center'} onClick={onCancel} gap={8}>
          <IconFont type="back" />
          Manage Tags
        </Flex>
        <Box className="ui-drawer-sub">
          Buckets are containers for data stored on BNB Greenfield. Bucket name must be globally
          unique.
        </Box>
      </QDrawerHeader>
      <QDrawerBody>
        <Flex gap={12} flexDir={'column'}>
          {internalTags &&
            internalTags.map((item, index) => (
              <Flex key={index} gap={16} alignItems={'start'}>
                <FormControl w={172} isInvalid={!!isInvalid('key', item.key)} alignItems={'start'}>
                  <Input
                    value={item.key}
                    onChange={(e) => onInputChange('key', e.target.value, index)}
                    placeholder="Key"
                  />
                  {isInvalid('key', item.key) && (
                    <FormErrorMessage>{isInvalid('key', item.key)}</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  flex={1}
                  alignItems={'start'}
                  isInvalid={!!isInvalid('value', item.value)}
                >
                  <Input
                    value={item.value}
                    onChange={(e) => onInputChange('value', e.target.value, index)}
                    placeholder="Value"
                  />
                  {isInvalid('value', item.value) && (
                    <FormErrorMessage>{isInvalid('value', item.value)}</FormErrorMessage>
                  )}
                </FormControl>
                <IconFont type="delete" w={24} onClick={() => onDelete(index)} />
              </Flex>
            ))}
          <AddTagItem onClick={onAddTagItem} disabled={internalTags.length >= 4} />
        </Flex>
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton variant="ghost" w={'100%'} onClick={onCancel}>
          Cancel
        </DCButton>
        <DCButton variant="brand" w={'100%'} onClick={() => onSave(internalTags)}>
          Save
        </DCButton>
      </QDrawerFooter>
    </>
  );
};

export type EditTagsProps = {
  tagsData: ResourceTags_Tag[];
  onClick: () => void;
  containerStyle?: ButtonProps;
  disabled?: false;
};
export const EditTags = ({
  tagsData,
  onClick,
  disabled = false,
  containerStyle = {},
}: EditTagsProps) => {
  const validTags = tagsData.filter((item) => item.key && item.value);
  const TagContent = () => {
    if (validTags && validTags.length > 0) {
      return (
        <>
          <Text as="span">Edit Tags</Text>
          <Text
            as="span"
            _hover={{
              color: 'inherit',
            }}
          >
            ({validTags.length})
          </Text>
        </>
      );
    }
    return <>Add Tags</>;
  };

  return (
    <DCButton
      variant="ghost"
      width={'fit-content'}
      h={31}
      fontSize={12}
      fontWeight={500}
      gap={4}
      color={'readable.secondary'}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      {...containerStyle}
    >
      <TagContent />
    </DCButton>
  );
};

export const AddTagItem = ({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <DCButton
      variant="ghost"
      width={'fit-content'}
      h={31}
      fontSize={12}
      fontWeight={500}
      color={'readable.secondary'}
      disabled={disabled}
      onClick={onClick}
    >
      Add Tags
    </DCButton>
  );
};

export const getValidTags = (tags: ResourceTags_Tag[]) => {
  if (!tags) return [];
  return tags.filter((item) => item.key && item.value);
};
