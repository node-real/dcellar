import React, { memo, ReactNode } from 'react';
import styled from '@emotion/styled';
import { Box, Button, Flex, Text } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { transientOptions } from '@/utils/transientOptions';
// import Avatar0 from '@/components/common/SvgIcon/avatars/Avatar0.svg';
import { setEditShare, setupObjectPolicies } from '@/store/slices/object';
import { CopyButton } from '@/modules/object/components/CopyButton';
import { getShareLink } from '@/utils/string';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { useAsyncEffect } from 'ahooks';
import { LoadingAdaptor } from '@/modules/accounts/components/LoadingAdaptor';
import { GROUP_MEMBER_AVATARS } from '@/modules/group/components/GroupDetail';
import Group0 from '@/components/common/SvgIcon/avatars/Group0.svg';
import Group1 from '@/components/common/SvgIcon/avatars/Group1.svg';
import Group2 from '@/components/common/SvgIcon/avatars/Group2.svg';
import Group3 from '@/components/common/SvgIcon/avatars/Group3.svg';

interface SharePermissionProps {}

const Access: Record<number, { icon: ReactNode; text: string; bg: string }> = {
  [VisibilityType.VISIBILITY_TYPE_PUBLIC_READ]: {
    icon: <PublicFileIcon fillColor={'#1E2026'} w={16} h={16} />,
    text: 'Public',
    bg: '#E7F3FD',
  },
  [VisibilityType.VISIBILITY_TYPE_PRIVATE]: {
    icon: <PrivateFileIcon fillColor={'#1E2026'} w={16} h={16} />,
    text: 'Private',
    bg: '#E6E8EA',
  },
};

export const OBJECT_POLICY_GROUP_AVATARS = [Group0, Group1, Group2, Group3];

export const SharePermission = memo<SharePermissionProps>(function SharePermission() {
  const dispatch = useAppDispatch();
  const { editDetail, bucketName, objectPolicies } = useAppSelector((root) => root.object);
  const { owner } = useAppSelector((root) => root.bucket);

  useAsyncEffect(async () => {
    if (!editDetail.name || !bucketName) return;
    dispatch(setupObjectPolicies(bucketName, editDetail.objectName));
  }, [dispatch, editDetail.name, bucketName]);

  if (!editDetail.name) return <></>;

  const CurrentAccess = Access[editDetail.visibility] ? Access[editDetail.visibility] : Access[2];
  const path = [bucketName, editDetail.objectName].join('/');
  const loading = !(path in objectPolicies);
  const members = objectPolicies[path] || [];
  const total = members.length;
  const empty = !loading && !total;
  const moreText = total <= 5 ? '' : total === 1000 ? '>1000' : `+${total - 5}`;

  return (
    <>
      {editDetail.objectStatus === 1 && owner && (
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
                    const isGroup = !m.PrincipalValue.startsWith('0x');
                    const lastCharCode =
                      m.PrincipalValue[m.PrincipalValue.length - 1].charCodeAt(0);
                    const Avatar = isGroup
                      ? OBJECT_POLICY_GROUP_AVATARS[lastCharCode % 4]
                      : GROUP_MEMBER_AVATARS[lastCharCode % 5];
                    return (
                      <Box key={m.PrincipalValue + String(index)} title={m.PrincipalValue}>
                        <Avatar />
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
              onClick={() => dispatch(setEditShare({ record: editDetail, from: 'drawer' }))}
            >
              Manage Access
            </ManageAccess>
          </AccessRow>
          <Tip>Only people with access can open with the link.</Tip>
          <Box my={16}>
            <CopyButton text={getShareLink(bucketName, editDetail.objectName)}>
              Copy Link
            </CopyButton>
          </Box>
        </Container>
      )}
    </>
  );
});

const ManageAccess = styled(Button)`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  background: #fff;
  color: #474d57;
  height: 33px;

  :hover {
    background: #1e2026;
    color: #ffffff;
    border-color: #1e2026;
  }
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
