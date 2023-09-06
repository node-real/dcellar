import { memo, useCallback } from 'react';
import { Flex } from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCreatingGroup, setupGroups } from '@/store/slices/group';
import RefreshIcon from '@/public/images/icons/refresh.svg';
import { DCButton } from '@/components/common/DCButton';
import { debounce } from 'lodash-es';

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

  const onCreate = () => {
    dispatch(setCreatingGroup(true));
  };

  return (
    <Flex gap={12}>
      {showRefresh && (
        <Flex onClick={onRefresh} alignItems="center" height={40} mr={12} cursor="pointer">
          <RefreshIcon />
        </Flex>
      )}
      <DCButton variant="dcPrimary" h={40} onClick={onCreate}>
        Create Group
      </DCButton>
    </Flex>
  );
});
