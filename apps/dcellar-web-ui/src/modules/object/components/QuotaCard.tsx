import React, { memo } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import styled from '@emotion/styled';
import { formatBytes } from '@/modules/file/utils';
import { setEditQuota } from '@/store/slices/bucket';

interface QuotaCardProps {}

export const QuotaCard = memo<QuotaCardProps>(function QuotaCard() {
  const dispatch = useAppDispatch();
  const { quotas } = useAppSelector((root) => root.bucket);
  const { bucketName } = useAppSelector((root) => root.object);
  const quota = quotas[bucketName];
  const { readQuota, freeQuota, consumedQuota } = quota || {
    readQuota: 0,
    freeQuota: 0,
    consumedQuota: 0,
  };

  const remain = readQuota + freeQuota - consumedQuota;
  const percent = (1 - consumedQuota / (readQuota + freeQuota)) * 100;

  const manageQuota = () => {
    dispatch(setEditQuota([bucketName, '']));
  };

  return (
    <Container gap={8}>
      <Flex justifyContent={'space-between'}>
        <Flex fontWeight={600}>
          {quota ? formatBytes(remain, true) : '--'}{' '}
          <Text ml={4} fontWeight={500} color="#76808F">
            of {quota ? formatBytes(readQuota + freeQuota, true) : '--'}
          </Text>
        </Flex>
        <Text
          as="span"
          color="#00BA34"
          _hover={{ color: '#2EC659' }}
          cursor="pointer"
          onClick={manageQuota}
        >
          Increase Quota
        </Text>
      </Flex>
      <Track>
        <Box w={`${percent}%`} h={8} bg="#00BA34" />
      </Track>
    </Container>
  );
});

const Container = styled(Flex)`
  width: 291px;
  padding: 8px 12px;
  flex-direction: column;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  background: #fff;
`;

const Track = styled.div`
  border-radius: 2px;
  overflow: hidden;
  background: #e6e8ea;
  height: 8px;
`;
