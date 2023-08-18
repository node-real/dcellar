import { MenuCloseIcon, SearchIcon } from '@totejs/icons';
import {
  Box,
  BoxProps,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemProps,
  MenuList,
  MenuListProps,
  MenuProps,
  rgba,
  useDisclosure,
  InputProps,
} from '@totejs/uikit';
import React, { useEffect, useRef, useState } from 'react';

import { useKeyDown } from '@/hooks/useKeyDown';
import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { GAClick } from '@/components/common/GATracker';

interface ListItemProps extends MenuItemProps {
  gaClickName?: string;
}

export interface IDCSelectOption {
  label: React.ReactNode;
  value: any;
  [x: string]: any;
}

export interface DCSelectProps extends MenuProps {
  header?: React.ReactNode;
  Footer?: () => JSX.Element;
  value?: string;
  text: string;
  placeholder?: string;
  options?: Array<IDCSelectOption>;
  headerProps?: BoxProps;
  listProps?: MenuListProps;
  itemProps?: ListItemProps;
  onChange?: (value: any) => void;
  onSearchFilter?: (value: string, item: IDCSelectOption) => boolean;
  onSearch?: (result: Array<IDCSelectOption>) => void;
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
    Footer,
    onChange,
    onSearchFilter,
    onSearch,
    children,
    ...restProps
  } = props;

  const { isOpen, onClose, onOpen } = useDisclosure();
  const [resultOptions, setResultOptions] = useState<Array<IDCSelectOption>>();

  const saveOnSearchRef = useSaveFuncRef(onSearch);
  useEffect(() => {
    if (isOpen) {
      setResultOptions(options);
      saveOnSearchRef.current?.(options);
    }
  }, [ isOpen, options, saveOnSearchRef]);

  const onEnter = () => {
    if (resultOptions?.length) {
      onSelectItem(resultOptions[0]);
      onClose();
    }
  };

  const onSelectItem = (item: IDCSelectOption) => {
    onChange?.(item.value);
  };

  const onChangeKeyword = (value: string) => {
    const result: Array<IDCSelectOption> = value ? [] : options;
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
    <Menu
      isOpen={isOpen}
      isDisabled={isOpen}
      matchWidth={true}
      placement="bottom-start"
      onClose={onClose}
      flip={false}
      {...restProps}
    >
      <MenuButton
        as={SelectInput}
        requestFocus={isOpen}
        onClick={onOpen}
        placeholder={placeholder}
        text={text}
        onChangeKeyword={onChangeKeyword}
        onEnter={onEnter}
      />
      {!!resultOptions?.length && <MenuList border="1px solid readable.border" borderRadius={8} {...listProps}>
        {header && (
          <Box
            color="#2AA372"
            fontSize={12}
            lineHeight="15px"
            bg="bg.bottom"
            py={8}
            px={24}
            fontWeight={500}
            borderBottom="1px solid readable.border"
            {...headerProps}
          >
            {header}
          </Box>
        )}
        <Box
          maxH={220}
          overflowY="scroll"
          sx={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'readable.disabled',
              borderRadius: '4px',
            },
          }}
        >
          {resultOptions?.map((item) => {
            const isSelected = value === item.value;
            const { gaClickName, ...restItemProps } = itemProps ?? {};

            return (
              <GAClick key={item.value} name={gaClickName}>
                <MenuItem
                  px={24}
                  py={8}
                  transitionDuration="normal"
                  transitionProperty="colors"
                  bg={isSelected ? rgba('#00BA34', 0.1) : undefined}
                  _hover={{
                    bg: isSelected ? undefined : 'bg.bottom',
                  }}
                  onClick={() => onSelectItem(item)}
                  _last={{
                    mb: 8,
                  }}
                  {...restItemProps}
                >
                  {item.label}
                </MenuItem>
              </GAClick>
            );
          })}

          {/* {!resultOptions?.length && <NoResult />} */}
        </Box>
        {Footer && <Footer />}
      </MenuList>}
    </Menu>
  );
}

interface SelectInputProps extends InputProps {
  onChangeKeyword: (value: string) => void;
  requestFocus: boolean;
  text: string;
  placeholder: string;
  onEnter: () => void;
}

const SelectInput = React.forwardRef((props: SelectInputProps, ref: any) => {
  const { requestFocus, placeholder = '', text, onChangeKeyword, onEnter, ...restProps } = props;

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
    setValue(text);
  }, [text, requestFocus]);

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
        ref={inputRef}
        h={52}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        cursor={requestFocus ? 'auto' : 'pointer'}
        borderColor={requestFocus ? 'scene.primary.active' : '#EAECF0'}
      />
      <InputRightElement color="readable.tertiary" pointerEvents="none">
        {requestFocus ? <SearchIcon /> : <MenuCloseIcon />}
      </InputRightElement>
    </InputGroup>
  );
});
