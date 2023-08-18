import { memo } from 'react';
import Head from 'next/head';
import { GroupContainer, PageTitle, PanelContainer } from '@/modules/group/group.style';
import { NewGroup } from '@/modules/group/components/NewGroup';
import { GroupList } from '@/modules/group/components/GroupList';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import { setupGroups } from '@/store/slices/group';

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
    <GroupContainer>
      <Head>
        <title>Groups - DCellar</title>
      </Head>
      <PanelContainer>
        <PageTitle>Groups</PageTitle>
        <NewGroup />
      </PanelContainer>
      <GroupList />
    </GroupContainer>
  );
});
