import { IconFont } from '@/components/IconFont';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import styled from '@emotion/styled';
import { memo } from 'react';

interface GroupNameColumnProps {
  item: GroupInfo;
}

export const GroupNameColumn = memo<GroupNameColumnProps>(function NameItem({ item }) {
  return (
    <Container>
      <IconFont type="group-thumbnail" w={20} />{' '}
      <span title={item.groupName}>{item.groupName}</span>
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  span {
    margin: 0 4px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
