import { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditGroupTagsData, setGroupOperation, setupGroupMembers } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useAsyncEffect, useUnmount } from 'ahooks';
import { Box, Divider, Flex, QDrawerBody, QDrawerHeader, Text } from '@node-real/uikit';
import styled from '@emotion/styled';
import { LoadingAdaptor } from '@/modules/accounts/components/LoadingAdaptor';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { ethers } from 'ethers';
import { Avatar } from '@/components/Avatar';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DEFAULT_TAG } from '@/components/common/ManageTags';

interface DetailGroupOperationProps {
  selectGroup: GroupInfo;
}

export const DetailGroupOperation = memo<DetailGroupOperationProps>(function GroupDetail({
  selectGroup,
}) {
  const dispatch = useAppDispatch();
  const { groupMembers } = useAppSelector((root) => root.group);
  const { spInfo, oneSp } = useAppSelector((root) => root.sp);

  useAsyncEffect(async () => {
    dispatch(setupGroupMembers(selectGroup.id, spInfo[oneSp].endpoint));
  }, [dispatch, selectGroup]);

  const loading = !(selectGroup.id in groupMembers);
  const members = groupMembers[selectGroup.id] || [];
  const total = members.length;
  const empty = !loading && !total;
  const moreText = total <= 5 ? '' : total === 1000 ? '>1000' : `+${total - 5}`;
  const hexString = ethers.utils.hexZeroPad(
    ethers.BigNumber.from(selectGroup.id || 0).toHexString(),
    32,
  );
  const onEditTag = () => {
    dispatch(setEditGroupTagsData(selectGroup?.tags?.tags ?? [DEFAULT_TAG]));
    dispatch(setGroupOperation({ level: 1, operation: [selectGroup.id, 'update_tags'] }));
  }

  useUnmount(() => dispatch(setEditGroupTagsData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader>Group Detail</QDrawerHeader>
      <QDrawerBody>
        <Flex mb={24} flexDirection={'column'} alignItems={'center'} display={'flex'}>
          <Flex w="100%" overflow="hidden">
            <IconFont w={48} type={'detail-group'} />
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
                {selectGroup.groupName}
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
                {selectGroup.extra || '--'}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={8} flexDir={'column'}>
          <Divider />
          <Flex
            paddingY={4}
            fontWeight={500}
            lineHeight="normal"
            justifyContent="space-between"
            alignItems={'center'}
          >
            <Text color="#76808F">Group ID</Text>
            <CopyText
              alignItems="center"
              value={selectGroup.id}
              fontWeight={400}
              iconProps={{ boxSize: 16, ml: 4 }}
              lineHeight={0}
            >
              <Text
                as="a"
                textDecoration="underline"
                _hover={{ textDecoration: 'underline', color: '#00BA34' }}
                target="_blank"
                href={`${GREENFIELD_CHAIN_EXPLORER_URL}/group/${hexString}`}
              >
                {selectGroup.id}
              </Text>
            </CopyText>
          </Flex>
          <Flex
            paddingY={4}
            fontWeight={500}
            lineHeight="normal"
            justifyContent="space-between"
            alignItems={'center'}
          >
            <Text color={'#76808F'}>Tags</Text>
            <Flex alignItems={'center'} gap={4} color={'brand.brand6'} cursor={'pointer'} onClick={onEditTag}>
              <IconFont type="pen" />
              {selectGroup?.tags?.tags?.length || 0} tags
            </Flex>
          </Flex>
          <Divider />
        </Flex>
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
                    return (
                      <Box key={m.AccountId} title={m.AccountId}>
                        <Avatar id={m.AccountId} w={32} />
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
              variant={'ghost'}
              onClick={() =>
                dispatch(setGroupOperation({ level: 1, operation: [selectGroup.id, 'add'] }))
              }
            >
              Manage Members
            </ManageMembers>
          </Flex>
        </Box>
      </QDrawerBody>
    </>
  );
});

const ManageMembers = styled(DCButton)`
  font-size: 12px;
  height: 33px;
`;
