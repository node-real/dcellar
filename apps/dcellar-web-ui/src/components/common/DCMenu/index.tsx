import { DCMenuList, MenuOption } from '@/components/common/DCMenuList';
import styled from '@emotion/styled';
import { Box, Menu, MenuListProps, MenuProps, Portal } from '@node-real/uikit';
import { ReactNode, memo } from 'react';

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
  zIndex?: number;
  scrollH?: number;
  multiple?: boolean;
}

// todo refactor
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
    stopPropagation = false,
    scrollH = 220,
    multiple = false,
    ...restProps
  } = props;
  const isFunc = typeof children === 'function';
  const strategy = restProps.strategy || 'absolute';

  return (
    <Menu strategy={strategy} {...restProps}>
      {(props) => {
        const menuList = (
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
            scrollH={scrollH}
            multiple={multiple}
            {...menuListProps}
          />
        );
        return (
          <>
            <Box display="contents" onClick={(e) => stopPropagation && e.stopPropagation()}>
              {isFunc ? children(props) : children}
            </Box>
            {strategy === 'fixed' ? (
              <Portal>
                <Container zIndex={restProps.zIndex || ''}>{menuList}</Container>
              </Portal>
            ) : (
              menuList
            )}
          </>
        );
      }}
    </Menu>
  );
});

const Container = styled(Box)`
  display: contents;
  .ui-menu {
    z-index: ${(props) => props.zIndex};
  }
`;
