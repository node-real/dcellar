import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Box, Button, Text } from '@totejs/uikit';

export const ObjectContainer = styled.div`
  margin: 24px;
`;

export const PanelContainer = styled.div`
  margin-bottom: 16px;
`;

export const PanelContent = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

export const ObjectName = styled.h1`
  word-break: break-all;
  font-weight: 700;
  font-size: 24px;
  line-height: 29px;
  max-width: 700px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: Inter, sans-serif;
`;

export const StyledRow = styled.div<{ $disabled: boolean }>`
  ${(props) =>
    props.$disabled &&
    css`
      color: #aeb4bc;
      a {
        pointer-events: none;
      }
    `}
`;

export const GoBack = styled(Box)`
  margin-right: 16px;
  svg {
    transform: rotate(180deg);
  }
  background: transparent;
  border-radius: 100%;
  cursor: pointer;
  :hover {
    background-color: #f5f5f5;
  }
`;

export const SelectedText = styled(Text)`
  color: #1e2026;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 19px;
`;

export const GhostButton = styled(Button)`
  height: 40px;
  background: #fff;
  border-color: #e6e8ea;
  &:hover {
    background: #1e2026;
    color: #ffffff;
    border-color: #1e2026;
  }
  &[disabled],
  &[disabled]:hover {
    background: #fff;
    opacity: 1;
    color: #aeb4bc;
    border-color: #e6e8ea;
  }
`;
