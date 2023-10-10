import { memo, PropsWithChildren } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { IconFont } from '@/components/IconFont';
import styled from '@emotion/styled';

interface ListEmptyProps extends PropsWithChildren {
  empty: boolean;
  title: string;
  desc: string;
  type: string;
  h?: number;
}

export const ListEmpty = memo<ListEmptyProps>(function ListEmpty({
  empty,
  title,
  desc,
  type,
  children,
  h = 438,
}) {
  return (
    <Container h={h}>
      <Content>
        {empty && (
          <Flex flex={1} flexDirection={'column'} alignItems={'center'} justifyContent="center">
            <IconFont type={type} w={120} />
            <Flex my={16} flexDirection="column">
              <Text
                color="readable.normal"
                lineHeight="normal"
                fontWeight={700}
                fontSize={18}
                mb={8}
              >
                {title}
              </Text>
              <Text lineHeight="normal" color={'readable.tertiary'}>
                {desc}
              </Text>
            </Flex>
            {children}
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

const Container = styled(Box)`
  display: grid;
  place-items: center;
`;
