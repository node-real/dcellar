import { IconFont } from '@/components/IconFont';
import { Badge, Text } from '@totejs/uikit';
import { Card } from './common';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/constants/paths';
import { useMount } from 'ahooks';
import { useAppDispatch } from '@/store';
import { setToolboxOperation } from '@/store/slices/toolbox';

const migrationPath = InternalRoutePaths.nft_migration;
export const NFTMigrationCard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const onMigrationClick = () => {
    dispatch(setToolboxOperation('nft-migration'))
  }
  useMount(() => {
    router.prefetch(migrationPath)
  });

  return (
    <Card
      onClick={() => onMigrationClick()}
    >
      <IconFont type="nft" w={48} />
      <Text fontSize={16} fontWeight={600}>
        NFT Migration
      </Text>
      <Badge colorScheme="primary" width={'fit-content'} borderRadius={4}>
        NFT Tool
      </Badge>
      <Text color={'readable.secondary'}>
        This is a long long long long long long long long long description.
      </Text>
    </Card>
  );
};
