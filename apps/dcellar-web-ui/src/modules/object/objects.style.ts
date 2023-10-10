import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Flex, Text } from '@totejs/uikit';

export const ObjectContainer = styled.div``;

export const PanelContainer = styled.div`
  margin-bottom: 16px;
`;

export const PanelContent = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 16px;
`;

export const GoBack = styled(Flex)`
  transition: all 0.2s;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  max-width: max-content;

  :hover {
    color: var(--ui-colors-readable-secondary);
  }
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

export const SelectedText = styled(Text)`
  color: #1e2026;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 19px;
`;
