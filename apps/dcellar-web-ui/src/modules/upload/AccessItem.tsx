import { Box, Button, Center, Flex, MenuButton, Text } from '@totejs/uikit';
import React, { forwardRef } from 'react';
import { find } from 'lodash-es';
import { useMount } from 'ahooks';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { IconFont } from '@/components/IconFont';
import { DCMenu } from '@/components/common/DCMenu';

const options = [
  {
    icon: <IconFont w={16} type={'private'} />,
    bgColor: '#E6E8EA',
    label: 'Private',
    desc: 'Only peoples with permission can access the objects.',
    value: VisibilityType.VISIBILITY_TYPE_PRIVATE,
  },
  {
    icon: <IconFont w={16} type={'public'} />,
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

  const CustomMenuButton = forwardRef(function CustomMenuButton(props: any, ref: any) {
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
        <IconFont type={'menu-close'} w={20} />
      </Button>
    );
  });

  useMount(() => {
    onChange(value);
  });

  const _options = options.map((v) => ({ ...v, value: String(v.value) }));

  return (
    <DCMenu
      value={value}
      selectIcon
      options={_options}
      placement="bottom-start"
      size={'sm'}
      offset={[20, 0]}
      onMenuSelect={({ value }) => onChange(Number(value))}
      renderOption={({ label, value }) => (
        <Box>
          <Text>{label}</Text>
          <Text fontSize="12px" color="readable.secondary">
            {_options[value === '2' ? 0 : 1].desc}
          </Text>
        </Box>
      )}
    >
      <MenuButton as={CustomMenuButton} disabled={freeze} width={'fit-content'}>
        {option.label}
      </MenuButton>
    </DCMenu>
  );
};

export default AccessItem;
