import { memo } from 'react';
import { Box, Button, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';
import { IconFont } from '@/components/IconFont';

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
  const menu = (
    <Menu placement="top">
      {({ isOpen }) => (
        <>
          <StyledButton
            $open={isOpen!}
            as={Button}
            rightIcon={isOpen ? <MenuOpenIcon /> : <MenuCloseIcon />}
          >
            {pageSize}
          </StyledButton>
          <MenuList minW={64} borderRadius={4}>
            {pageSizeOptions.map((p) => (
              <StyledMenuItem
                key={p}
                $active={p === pageSize}
                onClick={() => {
                  if (p === pageSize) return;
                  pageChange(p, false, false);
                }}
              >
                {p}
              </StyledMenuItem>
            ))}
          </MenuList>
        </>
      )}
    </Menu>
  );

  if (loading) return <Box h={45} mt={-1} bg="bg.middle" position="relative" />;

  return (
    <Container>
      {!simple && <>Rows per page: {menu}</>}
      <StyledBack
        type="back"
        $disabled={!canPrev}
        onClick={() => pageChange(pageSize, false, true)}
      />{' '}
      <StyledGo type="go" $disabled={!canNext} onClick={() => pageChange(pageSize, true, false)} />
    </Container>
  );
});
const disabled = css`
  pointer-events: none;
  cursor: not-allowed;
  color: #e6e8ea;
`;

const active = css`
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  :hover {
    color: #00ba34;
  }
`;

const StyledBack = styled(IconFont, transientOptions)<{ $disabled: boolean }>`
  ${active};
  ${(props) => props.$disabled && disabled}
`;

const StyledGo = styled(IconFont, transientOptions)<{ $disabled: boolean }>`
  ${active};
  margin-left: 16px;
  ${(props) => props.$disabled && disabled}
`;

const StyledMenuItem = styled(MenuItem, transientOptions)<{ $active: boolean }>`
  padding: 8px 12px;
  height: 28px;
  font-size: 12px;
  font-weight: 400;
  ${(props) =>
    props.$active &&
    css`
      background: rgba(0, 186, 52, 0.1);
    `}
`;

const StyledButton = styled(MenuButton, transientOptions)<{ $open: boolean }>`
  margin-left: 12px;
  margin-right: 24px;
  display: flex;
  padding: 8px 12px;
  align-items: center;
  border-radius: 4px;
  height: 28px;
  border: 1px solid #e6e8ea;
  background: #fff;
  font-size: 12px;
  color: #1e2026;
  justify-content: space-between;
  font-weight: 400;
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
  svg {
    pointer-events: none;
    width: 12px;
  }
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
