import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketEditQuota } from '@/store/slices/bucket';
import { formatQuota } from '@/utils/string';
import styled from '@emotion/styled';
import { Box, Flex, Text } from '@node-real/uikit';
import { memo } from 'react';

interface QuotaCardProps {}

export const QuotaCard = memo<QuotaCardProps>(function QuotaCard() {
  const dispatch = useAppDispatch();
  const bucketQuotaRecords = useAppSelector((root) => root.bucket.bucketQuotaRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);

  const quota = bucketQuotaRecords[currentBucketName];
  const formattedQuota = formatQuota(quota);

  const onManageQuota = () => {
    dispatch(setBucketEditQuota([currentBucketName, '']));
  };

  return (
    <Container gap={8}>
      <Flex justifyContent={'space-between'}>
        <Flex fontWeight={600}>
          {formattedQuota.remainText}{' '}
          <Text ml={4} fontWeight={500} color="#76808F">
            of {formattedQuota.totalText}
          </Text>
        </Flex>
        <Text
          as="span"
          color="#00BA34"
          _hover={{ color: '#2EC659' }}
          cursor="pointer"
          onClick={onManageQuota}
        >
          Increase Quota
        </Text>
      </Flex>
      <Track>
        <Box w={`${formattedQuota.remainPercent}%`} h={8} bg="#00BA34" />
      </Track>
    </Container>
  );
});

const Container = styled(Flex)`
  width: 291px;
  padding: 7px 12px;
  flex-direction: column;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  background: #fff;

  :hover {
    background: var(--ui-colors-bg-bottom);
  }
`;

const Track = styled.div`
  border-radius: 2px;
  overflow: hidden;
  background: #e6e8ea;
  height: 8px;
`;
