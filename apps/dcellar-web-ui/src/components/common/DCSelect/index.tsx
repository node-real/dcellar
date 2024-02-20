import {
  Box,
  BoxProps,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  MenuButton,
  MenuItemProps,
  MenuListProps,
  MenuProps,
  useDisclosure,
} from '@node-real/uikit';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useKeyDown } from '@/hooks/useKeyDown';
import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { IconFont } from '@/components/IconFont';

interface ListItemProps extends MenuItemProps {
  gaClickName?: string;
}

export interface DCSelectProps extends MenuProps {
  header?: () => ReactNode;
  footer?: () => ReactNode;
  value?: string;
  text: string;
  options?: MenuOption[];
  headerProps?: BoxProps;
  listProps?: MenuListProps;
  itemProps?: ListItemProps;
  onChange?: (value: any) => void;
  onSearchFilter?: (value: string, item: MenuOption) => boolean;
  onSearch?: (result: Array<MenuOption>) => void;
  renderOption?: (option: MenuOption) => ReactNode;
}

export function DCSelect(props: DCSelectProps) {
  const {
    value,
    text,
    options = [],
    listProps,
    itemProps,
    headerProps,
    header,
    footer,
    onChange,
    onSearchFilter,
    onSearch,
    children,
    renderOption,
    ...restProps
  } = props;

  const { isOpen, onClose, onOpen } = useDisclosure();
  const [resultOptions, setResultOptions] = useState<MenuOption[]>();

  const saveOnSearchRef = useSaveFuncRef(onSearch);
  useEffect(() => {
    if (isOpen) {
      setResultOptions(options);
      saveOnSearchRef.current?.(options);
    }
  }, [isOpen, options, saveOnSearchRef]);

  const onEnter = () => {
    if (resultOptions?.length) {
      onSelectItem(resultOptions[0]);
      onClose();
    }
  };

  const onSelectItem = (item: MenuOption) => {
    onChange?.(item.value);
  };

  const onChangeKeyword = (value: string) => {
    const result: Array<MenuOption> = value ? [] : options;

    if (value) {
      options.forEach((item) => {
        if (onSearchFilter?.(value, item)) {
          result.push(item);
        }
      });
    }

    setResultOptions(result);
    onSearch?.(result);
  };

  return (
    <DCMenu
      value={value}
      isOpen={isOpen}
      isDisabled={isOpen}
      matchWidth={true}
      placement="bottom-start"
      onClose={onClose}
      flip={false}
      options={resultOptions || []}
      renderOption={renderOption}
      selectIcon
      onMenuSelect={onSelectItem}
      renderHeader={() =>
        header && (
          <Box
            fontSize={12}
            bg="bg.bottom"
            py={8}
            px={12}
            fontWeight={500}
            borderBottom="1px solid readable.border"
            {...headerProps}
          >
            {header()}
          </Box>
        )
      }
      renderFooter={() => footer && footer()}
      {...restProps}
    >
      <MenuButton
        as={SelectInput}
        requestFocus={isOpen}
        onClick={onOpen}
        placeholder={text}
        onChangeKeyword={onChangeKeyword}
        onEnter={onEnter}
        onBlur={onClose}
      />
    </DCMenu>
  );
}

interface SelectInputProps extends InputProps {
  onChangeKeyword: (value: string) => void;
  requestFocus: boolean;
  onEnter: () => void;
}

const SelectInput = React.forwardRef(function SelectInput(props: SelectInputProps, ref: any) {
  const { requestFocus, placeholder = '', onChangeKeyword, onEnter, ...restProps } = props;

  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let raf: any;
    const onForceFocus = () => {
      if (requestFocus) {
        inputRef.current?.focus();
        raf = window.requestAnimationFrame(onForceFocus);
      } else {
        inputRef.current?.blur();
      }
    };
    raf = window.requestAnimationFrame(onForceFocus);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [requestFocus]);

  useEffect(() => {
    setValue(requestFocus ? '' : placeholder);
  }, [placeholder, requestFocus]);

  useKeyDown({
    key: 'Enter',
    ref: inputRef,
    handler: onEnter,
  });

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const trimValue = event.target.value.trim();
    setValue(trimValue);
    onChangeKeyword?.(trimValue);
  };

  return (
    <InputGroup ref={ref} {...restProps}>
      <Input
        fontSize={16}
        ref={inputRef}
        h={52}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        cursor={requestFocus ? 'auto' : 'pointer'}
        borderColor={requestFocus ? 'scene.primary.active' : 'readable.border'}
      />
      <InputRightElement color="readable.tertiary" pointerEvents="none" mr={4}>
        <IconFont type={requestFocus ? 'search' : 'menu-close'} w={24} />
      </InputRightElement>
    </InputGroup>
  );
});
