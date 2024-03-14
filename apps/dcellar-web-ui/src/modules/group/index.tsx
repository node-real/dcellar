import { GroupList } from '@/modules/group/components/GroupList';
import { CreateGroup } from '@/modules/group/components/CreateGroup';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupGroupList } from '@/store/slices/group';
import { useAsyncEffect, useDocumentVisibility, useUpdateEffect } from 'ahooks';
import { memo } from 'react';
import { PageTitle } from '@/components/layout/PageTitle';
import { DeleteGroupOperation } from '@/modules/group/components/DeleteGroupOperation';
import { GroupOperations } from '@/modules/group/components/GroupOperations';
import { GAContextProvider } from '@/context/GAContext';

interface GroupsPageProps {}

export const GroupsPage = memo<GroupsPageProps>(function GroupsPage() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const documentVisibility = useDocumentVisibility();

  useUpdateEffect(() => {
    if (documentVisibility !== 'visible') return;
    if (!loginAccount) return;
    dispatch(setupGroupList(loginAccount));
  }, [documentVisibility]);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupGroupList(loginAccount));
  }, [loginAccount, dispatch]);

  return (
    <GAContextProvider prefix={'dc.group'}>
      <DeleteGroupOperation />
      <GroupOperations />
      <GroupOperations level={1} />

      <PageTitle title={'Groups'} metaTitle={'Groups'}>
        <CreateGroup />
      </PageTitle>
      <GroupList />
    </GAContextProvider>
  );
});
