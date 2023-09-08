import React, { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAddGroupMember, setDetailGroup, setupGroupMembers } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useAsyncEffect, useUnmount } from 'ahooks';
import { DCDrawer } from '@/components/common/DCDrawer';
import { Box, Button, Divider, Flex, QDrawerBody, QDrawerHeader, Text } from '@totejs/uikit';
import DetailIcon from '@/components/common/SvgIcon/GroupDetail.svg';
import styled from '@emotion/styled';
import { LoadingAdaptor } from '@/modules/accounts/components/LoadingAdaptor';
import Avatar0 from '@/components/common/SvgIcon/avatars/Avatar0.svg';
import Avatar1 from '@/components/common/SvgIcon/avatars/Avatar1.svg';
import Avatar2 from '@/components/common/SvgIcon/avatars/Avatar2.svg';
import Avatar3 from '@/components/common/SvgIcon/avatars/Avatar3.svg';
import Avatar4 from '@/components/common/SvgIcon/avatars/Avatar4.svg';

export const GROUP_MEMBER_AVATARS = [Avatar0, Avatar1, Avatar2, Avatar3, Avatar4];

interface GroupDetailProps {}

export const GroupDetail = memo<GroupDetailProps>(function GroupDetail() {
  const dispatch = useAppDispatch();
  const { detailGroup, groupMembers } = useAppSelector((root) => root.group);
  const { spInfo, oneSp } = useAppSelector((root) => root.sp);

  const onClose = () => {
    dispatch(setDetailGroup({} as GroupInfo));
  };

  useAsyncEffect(async () => {
    if (!detailGroup.id) return;
    dispatch(setupGroupMembers(detailGroup.id, spInfo[oneSp].endpoint));
  }, [dispatch, detailGroup.id]);

  useUnmount(onClose);

  const loading = !(detailGroup.id in groupMembers);
  const members = groupMembers[detailGroup.id] || [];
  const total = members.length;
  const empty = !loading && !total;
  const moreText = total <= 5 ? '' : total === 1000 ? '>1000' : `+${total - 5}`;

  return (
    <DCDrawer isOpen={!!detailGroup.groupName} onClose={onClose}>
      <QDrawerHeader>Group Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mt={8} mb={24} flexDirection={'column'} alignItems={'center'} display={'flex'}>
          <Flex w="100%" overflow="hidden">
            <DetailIcon />
            <Flex ml={24} flex={1} flexDirection={'column'}>
              <Text
                fontSize={18}
                fontWeight={600}
                lineHeight="normal"
                wordBreak={'break-all'}
                color={'readable.normal'}
                mb="8px"
                w={'100%'}
              >
                {detailGroup.groupName}
              </Text>
              <Text
                fontSize={14}
                lineHeight="normal"
                fontWeight={500}
                wordBreak={'break-all'}
                color={'readable.tertiary'}
                w={'100%'}
                as="div"
              >
                {detailGroup.extra || '--'}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Divider />
        <Flex
          my={8}
          fontWeight={500}
          lineHeight="normal"
          justifyContent="space-between"
          alignItems={'center'}
        >
          <Text color="#76808F">Group ID</Text>
          <Text>{detailGroup.id}</Text>
        </Flex>
        <Divider />
        <Box my={24}>
          <Text fontWeight={600} lineHeight="normal">
            Members
          </Text>
          <Flex my={8} alignItems="center" height={48}>
            <Flex color="#474D57" fontWeight={500} fontSize={12} flex={1}>
              <LoadingAdaptor
                loading={loading}
                empty={empty}
                emptyText="This group currently has no members."
              >
                <Flex gap={8}>
                  {members.slice(0, 5).map((m) => {
                    const Avatar = GROUP_MEMBER_AVATARS[m.AccountId.charCodeAt(20) % 5];
                    return (
                      <Box key={m.AccountId} title={m.AccountId}>
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
            <ManageMembers
              onClick={() => dispatch(setAddGroupMember({ record: detailGroup, from: 'drawer' }))}
            >
              Manage Members
            </ManageMembers>
          </Flex>
        </Box>
      </QDrawerBody>
    </DCDrawer>
  );
});

const ManageMembers = styled(Button)`
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
