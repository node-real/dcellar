import { runtimeEnv } from '@/base/env';
import { GroupList } from '@/modules/group/components/GroupList';
import { NewGroup } from '@/modules/group/components/NewGroup';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupGroups } from '@/store/slices/group';
import { networkTag } from '@/utils/common';
import { Box, Flex } from '@node-real/uikit';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import Head from 'next/head';
import { memo } from 'react';

interface GroupsPageProps {}

export const GroupsPage = memo<GroupsPageProps>(function GroupsPage() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const documentVisibility = useDocumentVisibility();

  useUpdateEffect(() => {
    if (documentVisibility !== 'visible') return;
    if (!loginAccount) return;
    dispatch(setupGroups(loginAccount));
  }, [documentVisibility]);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupGroups(loginAccount));
  }, [loginAccount, dispatch]);

  return (
    <>
      <Head>
        <title>Groups - DCellar{networkTag(runtimeEnv)}</title>
      </Head>
      <Flex mb={16} alignItems="center" justifyContent="space-between">
        <Box as="h1" fontSize={24} fontWeight={700}>
          Groups
        </Box>
        <NewGroup />
      </Flex>
      <GroupList />
    </>
  );
});
