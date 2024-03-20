import { transientOptions } from '@/utils/css';
import styled from '@emotion/styled';
import { Box } from '@node-real/uikit';
import { css } from '@emotion/react';

export const A = styled.a`
  :hover {
    color: #00ba34;
  }

  margin-left: 4px;
`;

export const TH = styled(Box)`
  padding: 8px;

  &:first-of-type {
    padding-left: 12px;
    padding-right: 12px;
  }

  svg {
    color: #aeb4bc;

    :hover {
      color: #76808f;
    }
  }
`;

export const TD = styled(Box, transientOptions)<{ $dot?: number }>`
  height: 31px;
  position: relative;
  font-size: 14px;
  font-weight: 400;

  ${(props) =>
    props.$dot &&
    css`
      :before {
        position: relative;
        top: -1px;
        margin-right: 4px;
        display: inline-flex;
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 100%;

        background-color: ${props.$dot < 100
          ? '#00BA34'
          : props.$dot < 200
            ? '#EEBE11'
            : '#EE3911'};
      }
    `}
`;
