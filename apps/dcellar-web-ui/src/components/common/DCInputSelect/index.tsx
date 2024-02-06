import { SearchIcon } from '@totejs/icons';
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
} from '@totejs/uikit';
import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { MenuOption } from '@/components/common/DCMenuList';
import { DCMenu } from '@/components/common/DCMenu';

interface ListItemProps extends MenuItemProps {
  gaClickName?: string;
}

export interface DCSelectProps extends MenuProps {
  header?: () => ReactNode;
  footer?: () => ReactNode;
  value?: string;
  text: string;
  RightIcon?: () => ReactElement;
  placeholder?: string;
  options?: Array<MenuOption>;
  headerProps?: BoxProps;
  listProps?: MenuListProps;
  itemProps?: ListItemProps;
  onChange?: (value: any) => void;
  onSearchFilter?: (value: string, item: MenuOption) => boolean;
  onSearch?: (result: Array<MenuOption>) => void;
  renderOption?: (option: MenuOption) => ReactNode;
  emptyIcon?: string;
  emptyText?: string;
}

export function DCInputSelect(props: DCSelectProps) {
  const {
    value,
    text,
    placeholder,
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
    isDisabled,
    RightIcon,
    renderOption,
    emptyIcon,
    emptyText,
    ...restProps
  } = props;

  const Right = RightIcon ? RightIcon : () => <SearchIcon />;
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [resultOptions, setResultOptions] = useState<Array<MenuOption>>();

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
    onChange?.(value);
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
      emptyIcon={emptyIcon}
      emptyText={emptyText}
      menuListProps={listProps}
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
        placeholder={text || placeholder}
        onChangeKeyword={onChangeKeyword}
        onEnter={onEnter}
        onBlur={onClose}
        RightIcon={Right}
        text={text}
        disabled={isDisabled}
      />
    </DCMenu>
  );
}

interface SelectInputProps extends InputProps {
  onChangeKeyword: (value: string) => void;
  requestFocus: boolean;
  text: string;
  placeholder: string;
  RightIcon: () => ReactElement;
  onEnter: () => void;
}

const SelectInput = React.forwardRef(function SelectInput(props: SelectInputProps, ref: any) {
  const {
    requestFocus,
    placeholder = '',
    text = '',
    onChangeKeyword,
    onEnter,
    disabled,
    RightIcon,
    ...restProps
  } = props;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const trimValue = event.target.value.trim();
    onChangeKeyword?.(trimValue);
  };

  return (
    <InputGroup ref={ref} {...restProps}>
      <Input
        disabled={disabled}
        h={52}
        value={text}
        onChange={onChange}
        placeholder={placeholder}
        cursor={requestFocus ? 'auto' : 'pointer'}
        borderColor={requestFocus ? 'scene.primary.active' : '#EAECF0'}
      />
      <InputRightElement color="readable.tertiary">
        {requestFocus ? <SearchIcon /> : <RightIcon />}
      </InputRightElement>
    </InputGroup>
  );
});
