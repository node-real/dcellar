import React, { memo, ReactNode } from 'react';
import styled from '@emotion/styled';
import { Box, Flex, Text } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { transientOptions } from '@/utils/css';
import { setObjectOperation, setupObjectPolicies } from '@/store/slices/object';
import { CopyButton } from '@/modules/object/components/CopyButton';
import { getShareLink } from '@/utils/string';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { useAsyncEffect } from 'ahooks';
import { LoadingAdaptor } from '@/modules/accounts/components/LoadingAdaptor';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { Avatar } from '@/components/Avatar';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';

interface SharePermissionProps {
  selectObjectInfo: ObjectMeta;
}

const Access: Record<number, { icon: ReactNode; text: string; bg: string }> = {
  [VisibilityType.VISIBILITY_TYPE_PUBLIC_READ]: {
    icon: <IconFont type="public" w={16} />,
    text: 'Public',
    bg: '#E7F3FD',
  },
  [VisibilityType.VISIBILITY_TYPE_PRIVATE]: {
    icon: <IconFont type="private" w={16} />,
    text: 'Private',
    bg: '#E6E8EA',
  },
};

export const SharePermission = memo<SharePermissionProps>(function SharePermission({
  selectObjectInfo,
}) {
  const dispatch = useAppDispatch();
  const { bucketName, objectPolicies } = useAppSelector((root) => root.object);
  const { owner } = useAppSelector((root) => root.bucket);
  const objectInfo = selectObjectInfo.ObjectInfo;

  useAsyncEffect(async () => {
    dispatch(setupObjectPolicies(bucketName, objectInfo.ObjectName));
  }, [dispatch]);

  const CurrentAccess = Access[objectInfo.Visibility] ? Access[objectInfo.Visibility] : Access[2];
  const path = [bucketName, objectInfo.ObjectName].join('/');
  const loading = !(path in objectPolicies);
  const members = objectPolicies[path] || [];
  const total = members.length;
  const empty = !loading && !total;
  const moreText = total <= 5 ? '' : total === 1000 ? '>1000' : `+${total - 5}`;

  return (
    <>
      {objectInfo.ObjectStatus === 1 && owner && (
        <Container>
          <Title>Share with</Title>
          <AccessRow>
            <AccessType $bg={CurrentAccess.bg}>
              <span>{CurrentAccess.icon}</span>
              {CurrentAccess.text}
            </AccessType>
            <Box mx={16} w={1} bg="#E6E8EA" h={43} />
            <Flex color="#474D57" fontWeight={500} fontSize={12} flex={1}>
              <LoadingAdaptor
                loading={loading}
                empty={empty}
                emptyText="This group currently has no members."
              >
                <Flex gap={8}>
                  {members.slice(0, 5).map((m, index) => {
                    return (
                      <Box key={m.PrincipalValue + String(index)} title={m.PrincipalValue}>
                        <Avatar id={m.PrincipalValue} w={32} />
                      </Box>
                    );
                  })}
                  {moreText && (
                    <Box
                      fontSize={12}
                      px={12}
                      borderRadius="360"
                      border="1px solid #E6E8EA"
                      lineHeight="32px"
                      color="#1E2026"
                    >
                      {moreText}
                    </Box>
                  )}
                </Flex>
              </LoadingAdaptor>
            </Flex>
            <Flex gap={8} flex={1} />
            <ManageAccess
              variant={'ghost'}
              onClick={() =>
                dispatch(
                  setObjectOperation({
                    level: 1,
                    operation: [`${bucketName}/${objectInfo.ObjectName}`, 'share'],
                  }),
                )
              }
            >
              Manage Access
            </ManageAccess>
          </AccessRow>
          <Tip>Only people with access can open with the link.</Tip>
          <Box my={16}>
            <CopyButton text={getShareLink(bucketName, objectInfo.ObjectName)}>
              Copy Link
            </CopyButton>
          </Box>
        </Container>
      )}
    </>
  );
});

const ManageAccess = styled(DCButton)`
  font-size: 12px;
  height: 33px;
`;

const AccessType = styled(Flex, transientOptions)<{ $bg: string }>`
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 4px;
  border-radius: 360px;
  border: 1px solid #e6e8ea;

  color: #1e2026;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;

  svg {
    width: 16px;
  }

  > span {
    padding: 4px;
    border-radius: 100%;
    background: ${(props) => props.$bg};
  }
`;

const AccessRow = styled(Flex)`
  margin: 8px 0;
  align-items: center;
  height: 48px;
`;

const Container = styled.div`
  margin: 24px 0;
`;

const Title = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
`;

const Tip = styled(Text)`
  color: #474d57;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;
