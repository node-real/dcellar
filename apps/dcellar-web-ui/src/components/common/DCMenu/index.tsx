import { memo, ReactNode } from 'react';
import { Box, Menu, MenuListProps, MenuProps, Portal } from '@totejs/uikit';
import { DCMenuList, MenuOption } from '@/components/common/DCMenuList';

interface DCMenuProps extends MenuProps {
  options: Array<MenuOption>;
  value?: string | number;
  renderOption?: (option: MenuOption) => ReactNode;
  onMenuSelect?: (value: MenuOption) => void;
  selectIcon?: boolean;
  menuListProps?: MenuListProps;
  renderHeader?: () => ReactNode;
  renderFooter?: () => ReactNode;
  emptyIcon?: string;
  emptyText?: string;
  stopPropagation?: boolean;
}

export const DCMenu = memo<DCMenuProps>(function DCMenu(props) {
  const {
    options,
    children,
    value,
    onMenuSelect,
    selectIcon,
    renderOption,
    menuListProps,
    renderHeader,
    renderFooter,
    emptyIcon,
    emptyText,
    stopPropagation = true,
    ...restProps
  } = props;
  const isFunc = typeof children === 'function';

  return (
    <Menu strategy="fixed" {...restProps}>
      {(props) => (
        <>
          <Box display="contents" onClick={(e) => stopPropagation && e.stopPropagation()}>
            {isFunc ? children(props) : children}
          </Box>
          <Portal>
            <DCMenuList
              value={value}
              options={options}
              onMenuSelect={onMenuSelect}
              selectIcon={selectIcon}
              renderOption={renderOption}
              renderHeader={renderHeader}
              renderFooter={renderFooter}
              emptyIcon={emptyIcon}
              emptyText={emptyText}
              {...menuListProps}
            />
          </Portal>
        </>
      )}
    </Menu>
  );
});
