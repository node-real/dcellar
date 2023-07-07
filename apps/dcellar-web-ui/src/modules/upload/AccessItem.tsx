import { MenuCloseIcon } from '@totejs/icons';
import { Box, Button, Center, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from '@totejs/uikit';
import React, { forwardRef, useState } from 'react';
import PrivateFileIcon from '../file/components/PrivateFileIcon';
import { VisibilityType } from '../file/type';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { useAppDispatch } from '@/store';
import { setEditUpload } from '@/store/slices/object';
import SelectedIcon from '@/public/images/files/icons/selected.svg';
const options = [
  {
    icon: <PrivateFileIcon fillColor="#1E2026" />,
    bgColor: '#E6E8EA',
    label: 'Private',
    desc: 'Only me can open with the link.',
    value: VisibilityType.VISIBILITY_TYPE_PRIVATE,
  },
  {
    icon: <PublicFileIcon fillColor="#1E2026" />,
    bgColor: '#E7F3FD',
    label: 'Public',
    desc: 'Anyone with the link can open at anytime and can find in explorer.',
    value: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  },
];

export const AccessItem = ({freeze}: {freeze: boolean}) => {
  const [value, setValue] = useState(options[0]);
  const dispatch = useAppDispatch();
  const CustomMenuButton = forwardRef((props: any, ref: any) => {
    const { children, ...restProps } = props;
    return (
      <Button
        ref={ref}
        _hover={{}}
        variant="ghost"
        border={'none'}
        justifyContent="space-between"
        px={12}
        fontWeight={600}
        fontSize={14}
        lineHeight={'17px'}
        _expanded={{
          '.ui-icon': {
            transform: 'rotate(-180deg)',
          },
        }}
        {...restProps}
      >
        <Flex align={'center'}>
          <Center borderRadius={'50%'} boxSize={24} mr={6} backgroundColor={value.bgColor}>
            {value.icon}
          </Center>
          {children}
        </Flex>
        <MenuCloseIcon transitionDuration="normal" />
      </Button>
    );
  });
  const onChangeValue = (value: any) => {
    setValue(value);
    dispatch(setEditUpload({ visibility: value.value }));
  };
  return (
    <Menu matchWidth={false} placement="bottom-start" size={'sm'} offset={[20, 0]} >
      <MenuButton as={CustomMenuButton} disabled={freeze} width={'fit-content'}>
        {value.label}
      </MenuButton>
      <MenuList borderRadius={8}>
        {options.map((item) => (
          <MenuItem
            fontSize={'14px'}
            padding={'12px 16px 12px 8px'}
            key={item.value}
            _selected={{ bg: 'primary.normal', color: 'white' }}
            isDisabled={value.value === item.value}
            _disabled={{backgroundColor: 'rgba(0, 186, 52, 0.10)'}}
            onClick={() => onChangeValue(item)}
          >
            {value.value === item.value ? <SelectedIcon /> : <Box w={16} h={16} />}
            <Text ml='8px'>
            {item.label}
            </Text>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default AccessItem;
