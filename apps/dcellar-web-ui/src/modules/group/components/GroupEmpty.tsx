import React, { memo } from 'react';
import styled from '@emotion/styled';
import NoGroups from '@/components/common/SvgIcon/members.svg';
import { Flex, Text } from '@totejs/uikit';
import { NewGroup } from '@/modules/group/components/NewGroup';

interface GroupEmptyProps {
  empty: boolean;
}

export const GroupEmpty = memo<GroupEmptyProps>(function GroupEmpty({ empty }) {
  return (
    <Container>
      <Content>
        {empty && (
          <Flex flex={1} flexDirection="column" alignItems="center" justifyContent="center">
            <NoGroups />
            <Flex marginBottom={'24px'} marginTop={'6px'} flexDirection="column">
              <Text fontSize="18px" lineHeight="22px" fontWeight={700} mt={'16px'} color="#1E2026">
                No Groups
              </Text>
              <Text
                fontSize={14}
                lineHeight="17px"
                fontWeight={400}
                mt={8}
                mb={16}
                color={'readable.tertiary'}
                textAlign={'center'}
              >
                Create a group to share permissions!👏
              </Text>
            </Flex>
            <NewGroup showRefresh={false} />
          </Flex>
        )}
      </Content>
    </Container>
  );
});

const Content = styled.div`
  display: grid;
  place-items: center;
  max-width: 568px;
`;

const Container = styled.div`
  height: 530px;
  display: grid;
  place-items: center;
`;
