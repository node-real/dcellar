import { Box, Center, MenuItem, MenuList, MenuListProps, Text } from '@totejs/uikit';
import { memo, ReactNode } from 'react';
import styled from '@emotion/styled';
import cn from 'classnames';
import { IconFont } from '@/components/IconFont';

export type MenuOption = {
  label: string;
  value: string;
  variant?: 'danger';
  disabled?: boolean;
};

export interface DCMenuListProps extends MenuListProps {
  options: Array<MenuOption>;
  value?: string | number;
  renderOption?: (option: MenuOption) => ReactNode;
  onMenuSelect?: (value: MenuOption) => void;
  selectIcon?: boolean;
  renderHeader?: () => ReactNode;
  renderFooter?: () => ReactNode;
  renderEmpty?: () => ReactNode;
}

export const DCMenuList = memo<DCMenuListProps>(function DCMenu(props) {
  const {
    value,
    options,
    onMenuSelect = () => {},
    selectIcon,
    renderOption,
    renderHeader,
    renderFooter,
    ...restProps
  } = props;

  return (
    <StyledMenuList {...restProps}>
      {renderHeader && renderHeader()}
      <Box maxH={220} className="menu-items">
        {options.map((option) => {
          const $selected = option.value === String(value);
          const classes = cn({
            'menu-selected-icon': selectIcon,
            'menu-selected': $selected,
            'menu-disabled': option.disabled,
            'menu-variant-danger': option.variant === 'danger',
          });

          return (
            <StyledMenuItem
              as="div"
              key={option.value}
              className={classes}
              onClick={(e) => {
                e.stopPropagation();
                if ($selected || option.disabled) return;
                onMenuSelect(option);
              }}
            >
              {$selected && selectIcon && <IconFont type="colored-check" w={16} />}
              {renderOption ? renderOption(option) : option.label}
            </StyledMenuItem>
          );
        })}
        {!options.length && (
          <Center flexDir="column" pt={21} minH={220} justifyContent="flex-start">
            <IconFont type="empty-object" w={120} />
            <Text
              mt={12}
              color="readable.tertiary"
              fontSize={12}
              fontWeight={500}
              lineHeight="15px"
            >
              No Result
            </Text>
          </Center>
        )}
      </Box>
      {renderFooter && renderFooter()}
    </StyledMenuList>
  );
});

const StyledMenuItem = styled(MenuItem)`
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  color: var(--ui-colors-readable-secondary);
  padding: 8px;
  background: var(--ui-colors-bg-middle);
  position: relative;

  body .ui-menu-list & {
    :not(.menu-disabled, .menu-selected, .menu-variant-danger):hover {
      background: var(--ui-colors-bg-bottom);
      color: var(--ui-colors-readable-secondary);
    }

    &.menu-selected {
      background: var(--ui-colors-opacity1);
    }

    &.menu-variant-danger {
      color: var(--ui-colors-scene-danger-normal);
    }

    &.menu-disabled {
      cursor: not-allowed;
      color: var(--ui-colors-readable-disable);
      background: var(--ui-colors-bg-middle);
    }
  }

  &.menu-selected-icon {
    padding-left: 32px;
    padding-right: 24px;

    > svg {
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;

const StyledMenuList = styled(MenuList)`
  border-radius: 4px;
  border: 1px solid var(--ui-colors-readable-border);
  background: #fff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

  .menu-items {
    overflow: auto;
  }
  
  .menu-items::-webkit-scrollbar {
    width: 4px
  },

  .menu-items::-webkit-scrollbar-thumb {
    background: var(--ui-colors-readable-disable);
    border-radius: 4px
  },
`;
