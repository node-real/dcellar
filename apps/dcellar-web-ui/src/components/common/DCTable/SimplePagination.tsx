import { memo } from 'react';
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import { BackIcon, GoIcon, MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';

const defaultPageSizeOptions = [10, 20, 50, 100, 500];

export interface SimplePaginationProps {
  pageSizeOptions?: number[];
  pageSize: number;
  pageChange?: (pageSize: number, next: boolean, prev: boolean) => void;
  canNext: boolean;
  canPrev: boolean;
  simple?: boolean;
}

export const SimplePagination = memo<SimplePaginationProps>(function SimplePagination({
  pageSizeOptions = defaultPageSizeOptions,
  pageSize,
  pageChange = () => {},
  canPrev,
  canNext,
  simple = false,
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
          <MenuList w={50} borderRadius={4}>
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
  return (
    <Container>
      {!simple && <>Rows per page: {menu}</>}
      <StyledBack $disabled={!canPrev} onClick={() => pageChange(pageSize, false, true)} />{' '}
      <StyledGo $disabled={!canNext} onClick={() => pageChange(pageSize, true, false)} />
    </Container>
  );
});
const disabled = css`
  pointer-events: none;
  cursor: not-allowed;
  color: #e6e8ea;
`;

const active = css`
  transition: all 0.2s;
  :hover {
    color: #00ba34;
  }
`;

const StyledBack = styled(BackIcon, transientOptions)<{ $disabled: boolean }>`
  ${active};
  ${(props) => props.$disabled && disabled}
`;

const StyledGo = styled(GoIcon, transientOptions)<{ $disabled: boolean }>`
  ${active};
  ${(props) => props.$disabled && disabled}
`;

const StyledMenuItem = styled(MenuItem, transientOptions)<{ $active: boolean }>`
  padding: 2px 4px;
  height: 19px;
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
  margin-right: 8px;
  display: flex;
  padding: 2px 4px;
  align-items: center;
  border-radius: 4px;
  height: 19px;
  width: 44px;
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #76808f;
  > svg {
    width: 20px;
    margin-left: 16px;
    cursor: pointer;
  }
`;
