import { Box, Center, MenuItem, MenuList, MenuListProps, Text } from '@totejs/uikit';
import { memo, ReactNode } from 'react';
import styled from '@emotion/styled';
import cn from 'classnames';
import { IconFont } from '@/components/IconFont';
import { css } from '@emotion/react';

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
  emptyIcon?: string;
  emptyText?: string;
  scrollH?: number;
  multiple?: boolean;
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
    emptyText = 'No Result',
    emptyIcon = 'empty-object',
    scrollH = 220,
    multiple = false,
    ...restProps
  } = props;

  return (
    <StyledMenuList {...restProps}>
      {renderHeader && renderHeader()}
      <Box maxH={scrollH} className="menu-items">
        {options.map((option) => {
          const $selected = option.value === String(value);
          const classes = cn({
            'menu-selected-icon': selectIcon,
            'menu-selected': $selected,
            'menu-disabled': option.disabled,
            'menu-variant-danger': option.variant === 'danger',
          });

          if (multiple)
            return (
              <StyledMultiItem
                key={option.value}
                className={cn(classes, 'ui-menu-item')}
                onClick={(e) => {
                  e.stopPropagation();
                  if ($selected || option.disabled) return;
                  onMenuSelect(option);
                }}
              >
                {$selected && selectIcon && <IconFont type="colored-check" w={16} />}
                {renderOption ? renderOption(option) : option.label}
              </StyledMultiItem>
            );
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
          <Center
            className={'menu-list-empty'}
            flexDir="column"
            pt={24}
            h={160}
            justifyContent="flex-start"
          >
            <IconFont className={'menu-list-empty-icon'} type={emptyIcon} w={64} />
            <Text mt={8} color="readable.normal" fontSize={14} fontWeight={600}>
              {emptyText}
            </Text>
          </Center>
        )}
      </Box>
      {renderFooter && renderFooter()}
    </StyledMenuList>
  );
});

const menuItemStyles = css`
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
  }
`;

const StyledMultiItem = styled.div`
  ${menuItemStyles};
  cursor: pointer;
`;

const StyledMenuItem = styled(MenuItem)`
  ${menuItemStyles};
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
