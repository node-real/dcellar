import styled from '@emotion/styled';
import { DCButton } from '@/components/common/DCButton';

export const BucketContainer = styled.div`
  margin: 24px;
`;

export const PanelContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  height: 40px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
`;

export const CreateBucket = styled(DCButton)`
  width: 161px;
  height: 40px;
  padding: 8px 24px;
  font-size: 14px;
  white-space: nowrap;
`;

export const SortItem = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 7px 16px;
  transition: all 0.2s;
  margin-left: -16px;
  margin-top: -7px;
  margin-bottom: -7px;
  > span {
    display: none;
  }
  :hover {
    color: #1e2026;
    > span {
      display: inline;
    }
    border-radius: 360px;
    background: rgba(0, 186, 52, 0.1);
  }
`;
