import { memo, useCallback } from 'react';
import { CreateBucketButton } from '@/modules/bucket/bucket.style';
import { AddIcon } from '@totejs/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditCreate, setupBuckets } from '@/store/slices/bucket';
import { Flex } from '@totejs/uikit';
import RefreshIcon from '@/public/images/icons/refresh.svg';
import { debounce } from 'lodash-es';

interface NewBucketProps {
  showRefresh?: boolean;
}

export const NewBucket = memo<NewBucketProps>(function NewBucket({ showRefresh = true }) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);

  const onRefresh = useCallback(
    debounce(() => {
      dispatch(setupBuckets(loginAccount, true));
    }, 300),
    [loginAccount],
  );

  return (
    <Flex gap={12}>
      {showRefresh && (
        <Flex onClick={onRefresh} alignItems="center" height={40} mr={12} cursor="pointer">
          <RefreshIcon />
        </Flex>
      )}
      <CreateBucketButton
        variant="dcPrimary"
        leftIcon={<AddIcon />}
        iconSpacing={8}
        onClick={() => dispatch(setEditCreate(true))}
      >
        New Bucket
      </CreateBucketButton>
    </Flex>
  );
});
