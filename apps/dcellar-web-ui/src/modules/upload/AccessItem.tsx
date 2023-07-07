import { MenuCloseIcon } from '@totejs/icons';
import { Button, Flex, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import React, { forwardRef, use, useEffect, useState } from 'react';
import PrivateFileIcon from '../file/components/PrivateFileIcon';
import { ChainVisibilityEnum } from '../file/type';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditUpload } from '@/store/slices/object';
const options = [
  {
    icon: <PrivateFileIcon fillColor="#1E2026" />,
    label: 'Private',
    desc: 'Only me can open with the link.',
    value: ChainVisibilityEnum.VISIBILITY_TYPE_PRIVATE,
  },
  {
    icon: <PublicFileIcon fillColor="#1E2026" />,
    label: 'Everyone can access',
    desc: 'Anyone with the link can open at anytime and can find in explorer.',
    value: ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ,
  },
];

export const AccessItem = () => {
  const [value, setValue] = useState(options[0]);
  const freeze = false;
  const dispatch = useAppDispatch();
  const { isOpen } = useAppSelector((state) => state.object.editUpload);
  const CustomMenuButton = forwardRef((props: any, ref: any) => {
    const { children, ...restProps } = props;
    return (
      <Button
        ref={ref}
        // w="100%"
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
          {/* <Center boxSize={24} mr={6}>
            <Circle size={10} bg="scene.primary.normal" />
          </Center> */}
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
    <Menu matchWidth={false} placement="bottom-start" size={'sm'}>
      <MenuButton as={CustomMenuButton} disabled={freeze} width={'fit-content'}>
        {value.label}
      </MenuButton>
      <MenuList borderRadius={8}>
        {options.map((item) => (
          <MenuItem
            key={item.value}
            isDisabled={value.value === item.value}
            onClick={() => onChangeValue(item)}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default AccessItem;
function dispatch(arg0: {
  payload: Partial<import('@/store/slices/object').TUpload>;
  type: 'object/setEditUpload';
}) {
  throw new Error('Function not implemented.');
}
