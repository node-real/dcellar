import { memo } from 'react';
import { Flex } from '@totejs/uikit';
import { trimLongStr } from '@/utils/string';
import { CloseIcon } from '@totejs/icons';
import * as React from 'react';
import { ADDRESS_RE } from '@/utils/constant';
import { IconFont } from '@/components/IconFont';

export type CustomTagProps = {
  label: React.ReactNode;
  value: any;
  disabled: boolean;
  onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  closable: boolean;
};

interface RenderItemProps {
  group?: boolean;
  value: CustomTagProps;
  invalidIds?: string[];
}

export const RenderItem = memo<RenderItemProps>(function RenderItem({
  value: { value, label, onClose },
  group = false,
  invalidIds = [],
}) {
  const address = value.match(ADDRESS_RE);
  const valid = !invalidIds.includes(value);
  const props = valid
    ? {
        border: '1px solid #E6E8EA',
        color: '#1E2026',
        bg: '#FAFAFA',
        _hover: {
          borderColor: '#00BA34',
          bg: 'rgba(0, 186, 52, 0.10)',
        },
      }
    : {
        border: '1px solid #EE3911',
        color: '#EE3911',
        bg: '#FDEBE7',
      };

  return (
    <Flex
      borderRadius={4}
      {...props}
      padding="8px 4px"
      alignItems="center"
      fontSize={12}
      h={32}
      gap={2}
      title={value}
      cursor="default"
    >
      {group && <IconFont type={'group'} w={16} />}
      {address ? label : trimLongStr(label as string, 20, 20, 0)}
      <CloseIcon
        onClick={onClose as any}
        cursor="pointer"
        width={12}
        color={valid ? '#76808F' : '#EE3911'}
        _hover={{ color: valid ? '#009E2C' : '#EE3911' }}
      />
    </Flex>
  );
});
