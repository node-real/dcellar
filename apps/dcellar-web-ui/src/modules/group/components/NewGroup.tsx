import { memo, useCallback } from 'react';
import { Flex } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { setGroupOperation, setupGroups } from '@/store/slices/group';
import { DCButton } from '@/components/common/DCButton';
import { debounce } from 'lodash-es';
import { IconFont } from '@/components/IconFont';

interface NewGroupProps {
  showRefresh?: boolean;
}

export const NewGroup = memo<NewGroupProps>(function NewGroup({ showRefresh = true }) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);

  const onRefresh = useCallback(
    debounce(() => {
      dispatch(setupGroups(loginAccount, true));
    }, 150),
    [loginAccount],
  );

  return (
    <Flex gap={12}>
      {showRefresh && (
        <DCButton
          variant="ghost"
          leftIcon={<IconFont type="refresh" w={24} />}
          onClick={onRefresh}
        />
      )}
      <DCButton onClick={() => dispatch(setGroupOperation({ operation: ['', 'create'] }))}>
        Create Group
      </DCButton>
    </Flex>
  );
});
