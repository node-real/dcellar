import { MenuCloseIcon } from '@totejs/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@totejs/uikit';
import React, { forwardRef } from 'react';
import PrivateFileIcon from '../file/components/PrivateFileIcon';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { find } from 'lodash-es';
import { useMount } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import SelectedIcon from '@/public/images/files/icons/selected.svg';

const options = [
  {
    icon: <PrivateFileIcon fillColor="#1E2026" />,
    bgColor: '#E6E8EA',
    label: 'Private',
    desc: 'Only peoples with permission can access the objects.',
    value: VisibilityType.VISIBILITY_TYPE_PRIVATE,
  },
  {
    icon: <PublicFileIcon fillColor="#1184EE" />,
    bgColor: '#E7F3FD',
    label: 'Public',
    desc: 'Anyone with a shared link can access objects.',
    value: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  },
];

interface AccessItemProps {
  value: VisibilityType;
  freeze: boolean;
  onChange: (val: VisibilityType) => void;
}

export const AccessItem = ({ value, freeze, onChange }: AccessItemProps) => {
  value = value || options[0].value;
  const option = find(options, (op) => op.value === value)!;

  const CustomMenuButton = forwardRef((props: any, ref: any) => {
    const { children, ...restProps } = props;
    return (
      <Button
        ref={ref}
        variant="ghost"
        border={'none'}
        justifyContent="space-between"
        p={'4px 0'}
        height={'32px'}
        w={'fit-content'}
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
          <Center borderRadius={'50%'} boxSize={24} mr={6} backgroundColor={option.bgColor}>
            {option.icon}
          </Center>
          {children}
        </Flex>
        <MenuCloseIcon transitionDuration="normal" />
      </Button>
    );
  });

  useMount(() => {
    onChange(value);
  });

  return (
    <Menu matchWidth={false} placement="bottom-start" size={'sm'} offset={[20, 0]}>
      <MenuButton as={CustomMenuButton} disabled={freeze} width={'fit-content'}>
        {option.label}
      </MenuButton>
      <MenuList borderRadius={8}>
        {options.map((item) => (
          <MenuItem
            fontSize={'14px'}
            padding={'12px 16px 12px 8px'}
            _selected={{ bg: 'primary.normal', color: 'white' }}
            key={item.value}
            alignItems={'flex-start'}
            isDisabled={option.value === item.value}
            _disabled={{ backgroundColor: 'rgba(0, 186, 52, 0.10)' }}
            onClick={() => onChange(item.value)}
          >
            {value === item.value ? <SelectedIcon /> : <Box w={16} h={16} />}
            <Box>
              <Text ml="8px">{item.label}</Text>
              <Text ml="8px" fontSize="12px" color="readable.secondary">
                {item.desc}
              </Text>
            </Box>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default AccessItem;
