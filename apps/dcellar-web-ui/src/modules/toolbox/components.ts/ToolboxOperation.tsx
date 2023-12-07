import { DCDrawer } from '@/components/common/DCDrawer';
import { useModalValues } from '@/hooks/useModalValues';
import { useAppDispatch, useAppSelector } from '@/store';
import { ToolboxOperationType, setToolboxOperation } from '@/store/slices/toolbox';
import { memo, useCallback, useMemo } from 'react';
import { NFTMigrationOperation } from './NFTMigrationOperation';

type ToolboxOperationsProps = {
  level?: 0 | 1;
};

export const ToolboxOperations = memo<ToolboxOperationsProps>(function ToolboxOperations({
  level = 0,
}) {
  const dispatch = useAppDispatch();
  const operation = useAppSelector((root) => root.toolbox.toolboxOperation);
  const _operation = useModalValues<ToolboxOperationType>(operation);
  const onClose = useCallback(() => {
    dispatch(setToolboxOperation(''));
  }, [dispatch]);

  const drawerContent = useMemo(() => {
    switch (_operation) {
      case 'nft-migration':
        return <NFTMigrationOperation />;
    }
  }, [_operation]);

  return (
    <>
      <DCDrawer isOpen={!!operation} onClose={onClose}>
        {drawerContent}
      </DCDrawer>
    </>
  );
});
