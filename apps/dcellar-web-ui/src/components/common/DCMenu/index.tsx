import { memo, ReactNode } from 'react';
import { Menu, MenuListProps, MenuProps } from '@totejs/uikit';
import { DCMenuList, MenuOption } from '@/components/common/DCMenuList';

interface DCMenuProps extends MenuProps {
  options: Array<MenuOption>;
  value?: string | number;
  renderOption?: (option: MenuOption) => ReactNode;
  onMenuSelect?: (value: MenuOption) => void;
  selectIcon?: boolean;
  menuListProps?: MenuListProps;
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
    ...restProps
  } = props;
  const isFunc = typeof children === 'function';

  return (
    <Menu strategy="fixed" {...restProps}>
      {(props) => (
        <>
          {isFunc ? children(props) : children}
          <DCMenuList
            value={value}
            options={options}
            onMenuSelect={onMenuSelect}
            selectIcon={selectIcon}
            renderOption={renderOption}
            {...menuListProps}
          />
        </>
      )}
    </Menu>
  );
});
