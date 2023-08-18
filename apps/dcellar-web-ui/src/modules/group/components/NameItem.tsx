import { memo } from 'react';
import GroupIcon from '@/public/images/icons/group_icon.svg';
import styled from '@emotion/styled';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';

interface NameItemProps {
  item: GroupInfo;
}

export const NameItem = memo<NameItemProps>(function NameItem({ item }) {
  return (
    <Container>
      <GroupIcon /> <span title={item.groupName}>{item.groupName}</span>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  svg {
    flex-shrink: 0;
  }

  span {
    margin: 0 4px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
