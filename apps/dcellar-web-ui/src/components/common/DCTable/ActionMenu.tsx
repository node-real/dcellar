import React, { memo } from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import MenuIcon from '@/public/images/icons/menu.svg';
import { GAClick, GAShow } from '@/components/common/GATracker';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/transientOptions';

export type ActionMenuItem = { label: string; value: string };

interface ActionMenuProps {
  onChange?: (menu: string) => void;
  menus?: Array<ActionMenuItem>;
}

export const ActionMenu = memo<ActionMenuProps>(function ActionMenu({
  onChange = () => {},
  menus = [],
}) {
  return (
    <Menu placement="bottom-end" trigger="hover">
      {({ isOpen }) => (
        <>
          <StyledMenuButton $open={isOpen} onClick={(e) => e.stopPropagation()}>
            <MenuIcon />
          </StyledMenuButton>
          <MenuList w={120}>
            <GAShow name="dc.bucket.list_menu.0.show" isShow={isOpen} />
            {menus.map((m) => (
              <GAClick key={m.value} name={`dc.bucket.list_menu.${m.value}.click`}>
                <StyledMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(m.value);
                  }}
                >
                  {m.label}
                </StyledMenuItem>
              </GAClick>
            ))}
          </MenuList>
        </>
      )}
    </Menu>
  );
});

export const StyledMenuButton = styled(MenuButton, transientOptions)<{ $open?: boolean }>`
  border-radius: 100%;
  width: 24px;
  cursor: pointer;
  transition: all 0.1s;
  :hover {
    background-color: rgba(0, 186, 52, 0.2);
    color: #00ba34;
  }
  background-color: ${(props) => (props.$open ? 'rgba(0, 186, 52, 0.1)' : 'transparent')};
  color: ${(props) => (props.$open ? '#00BA34' : '#1E2026')};
`;

export const StyledMenuItem = styled(MenuItem)`
  :hover {
    color: #009e2c;
    background-color: rgba(0, 186, 52, 0.1);
  }
`;