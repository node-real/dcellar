import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useAppDispatch, useAppSelector } from '@/store';
import { setGroupOperation, setupGroupList } from '@/store/slices/group';
import { Flex } from '@node-real/uikit';
import { debounce } from 'lodash-es';
import { memo, useCallback } from 'react';

interface NewGroupProps {
  showRefresh?: boolean;
}

export const CreateGroup = memo<NewGroupProps>(function NewGroup({ showRefresh = true }) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onGroupListRefresh = useCallback(
    debounce(() => {
      dispatch(setupGroupList(loginAccount, true));
    }, 150),
    [loginAccount],
  );

  return (
    <Flex gap={12}>
      {showRefresh && (
        <DCButton
          variant="ghost"
          leftIcon={<IconFont type="refresh" w={24} />}
          onClick={onGroupListRefresh}
        />
      )}
      <DCButton onClick={() => dispatch(setGroupOperation({ operation: ['', 'create'] }))}>
        Create Group
      </DCButton>
    </Flex>
  );
});
