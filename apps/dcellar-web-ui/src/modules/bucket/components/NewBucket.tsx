import { memo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketOperation, setEditCreate, setupBuckets } from '@/store/slices/bucket';
import { Flex } from '@totejs/uikit';
import { debounce } from 'lodash-es';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';

interface NewBucketProps {
  showRefresh?: boolean;
}

export const NewBucket = memo<NewBucketProps>(function NewBucket({ showRefresh = true }) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);

  const onRefresh = useCallback(
    debounce(() => {
      dispatch(setupBuckets(loginAccount, true));
    }, 150),
    [loginAccount],
  );

  return (
    <Flex gap={12}>
      {showRefresh && (
        <DCButton
          variant="ghost"
          onClick={onRefresh}
          leftIcon={<IconFont type="refresh" w={24} />}
        />
      )}
      <DCButton onClick={() => dispatch(setBucketOperation(['', 'create']))}>
        Create Bucket
      </DCButton>
    </Flex>
  );
});
