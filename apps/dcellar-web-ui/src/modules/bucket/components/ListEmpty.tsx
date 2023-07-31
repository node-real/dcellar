import { memo } from 'react';
import styled from '@emotion/styled';
import { Flex, Image, Text, Box } from '@totejs/uikit';
import { Tips } from '@/components/common/Tips';
import { NewBucket } from '@/modules/bucket/components/NewBucket';
import { assetPrefix } from '@/base/env';

interface ListEmptyProps {
  empty: boolean;
}

export const ListEmpty = memo<ListEmptyProps>(function ListEmpty({ empty }) {
  return (
    <Container>
      <Content>
        {empty && (
          <Flex flex={1} flexDirection={'column'} alignItems={'center'} justifyContent="center">
            <Image
              src={`${assetPrefix}/images/buckets/creating-bucket.svg`}
              w="120px"
              h="120px"
              alt="create bucket image"
              marginTop="-104px"
            />
            <Flex marginBottom={'24px'} marginTop={'6px'}>
              <Text
                fontSize={'14px'}
                fontWeight={500}
                lineHeight={'24px'}
                color={'readable.tertiary'}
              >
                Create a bucket to get started!👏
              </Text>
              <Tips
                iconSize="16px"
                containerWidth={'304px'}
                placement={'bottom-start'}
                tips={
                  <Box>
                    Every object in BNB Greenfield is stored in a bucket. To upload objects to BNB
                    Greenfield, you'll need to create a bucket where the objects will be stored.
                  </Box>
                }
              />
            </Flex>

            <NewBucket />
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
