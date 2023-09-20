import { memo } from 'react';
import styled from '@emotion/styled';
import { Flex, Text } from '@totejs/uikit';
import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { IconFont } from '@/components/IconFont';

interface ListEmptyProps {
  empty: boolean;
}

export const BucketListEmpty = memo<ListEmptyProps>(function ListEmpty({ empty }) {
  return (
    <Container>
      <Content>
        {empty && (
          <Flex flex={1} flexDirection={'column'} alignItems={'center'} justifyContent="center">
            <IconFont type="empty-bucket" w={120} />
            <Flex my={16} flexDirection="column">
              <Text
                color="readable.normal"
                lineHeight="normal"
                fontWeight={700}
                fontSize={18}
                mb={8}
              >
                No Buckets
              </Text>
              <Text lineHeight="normal" color={'readable.tertiary'}>
                Create a bucket to get started!👏
              </Text>
            </Flex>
            <NewBucket showRefresh={false} />
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
