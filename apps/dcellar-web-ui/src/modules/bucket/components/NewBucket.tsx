import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBucketOperation, setupBuckets } from '@/store/slices/bucket';
import { Flex } from '@node-real/uikit';
import { debounce } from 'lodash-es';
import { memo, useCallback } from 'react';

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
      <DCButton onClick={() => dispatch(setBucketOperation({ operation: ['', 'create'] }))}>
        Create Bucket
      </DCButton>
    </Flex>
  );
});
