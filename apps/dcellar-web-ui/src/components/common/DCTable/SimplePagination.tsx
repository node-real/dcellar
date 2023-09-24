import { memo } from 'react';
import { Box, Flex, MenuButton } from '@totejs/uikit';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/css';
import { css } from '@emotion/react';
import { IconFont } from '@/components/IconFont';
import { MenuOption } from '@/components/common/DCMenuList';
import { DCMenu } from '@/components/common/DCMenu';
import cn from 'classnames';

const defaultPageSizeOptions = [10, 20, 50, 100, 500];

export interface SimplePaginationProps {
  pageSizeOptions?: number[];
  pageSize: number;
  pageChange?: (pageSize: number, next: boolean, prev: boolean) => void;
  canNext: boolean;
  canPrev: boolean;
  simple?: boolean;
  loading?: boolean;
}

export const SimplePagination = memo<SimplePaginationProps>(function SimplePagination({
  pageSizeOptions = defaultPageSizeOptions,
  pageSize,
  pageChange = () => {},
  canPrev,
  canNext,
  simple = false,
  loading = false,
}) {
  const options: MenuOption[] = pageSizeOptions.map((i) => ({
    label: String(i),
    value: String(i),
  }));

  const menu = (
    <DCMenu
      value={pageSize}
      menuListProps={{ minW: 75 }}
      placement="top"
      trigger="click"
      options={options}
      onMenuSelect={({ value }) => pageChange(Number(value), false, false)}
    >
      {({ isOpen }) => (
        <StyledButton $open={isOpen}>
          {pageSize} <IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />
        </StyledButton>
      )}
    </DCMenu>
  );

  if (loading) return <Box h={45} mt={-4} bg="bg.middle" position="relative" borderRadius={4} />;

  return (
    <Container>
      {!simple && <>Rows per page: {menu}</>}
      <Flex gap={16}>
        <StyledNav
          type="back"
          className={cn({ 'nav-disabled': !canPrev })}
          onClick={() => canPrev && pageChange(pageSize, false, true)}
        />{' '}
        <StyledNav
          type="go"
          className={cn({ 'nav-disabled': !canNext })}
          onClick={() => canNext && pageChange(pageSize, true, false)}
        />
      </Flex>
    </Container>
  );
});
const StyledNav = styled(IconFont)`
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;

  :not(.nav-disabled):hover {
    color: #00ba34;
  }

  &.nav-disabled {
    cursor: not-allowed;
    color: var(--ui-colors-readable-disable);
  }
`;

const StyledButton = styled(MenuButton, transientOptions)<{ $open?: boolean }>`
  margin-left: 12px;
  margin-right: 24px;
  display: flex;
  padding: 8px 12px;
  align-items: center;
  border-radius: 4px;
  gap: 4px;
  height: 28px;
  border: 1px solid #e6e8ea;
  background: #fff;
  font-size: 14px;
  color: #1e2026;
  font-weight: 500;
  cursor: pointer;

  :hover {
    border-color: #00ba34;
    background: #fff;
  }

  ${(props) =>
    props.$open &&
    css`
      border-color: #00ba34;
      background: #fff;
    `}
`;

const Container = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-colors-readable-tertiary);
`;
