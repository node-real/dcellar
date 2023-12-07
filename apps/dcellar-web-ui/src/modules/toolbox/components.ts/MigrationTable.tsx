import { useCallback, useState } from 'react';
import { DCTable } from '@/components/common/DCTable';
import { ColumnProps } from 'antd/es/table';
import { Box } from '@totejs/uikit';
import { Loading } from '@/components/common/Loading';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { useAppSelector } from '@/store';
import { NFTDataType, selectNftData } from '@/store/slices/toolbox';
import { EllipsisText } from '@/components/common/EllipsisText';
import { useCreation } from 'ahooks';
import { chunk } from 'lodash-es';

const PAGE_SIZE = 5;
export const MigrationTable = () => {
  const pageSize = PAGE_SIZE;
  const [currentPage, setCurrentPage] = useState(1);
  const { nftAddress, loadingNftData } = useAppSelector((root) => root.toolbox);
  const nftData = useAppSelector(selectNftData(nftAddress));
  console.log('nftData', nftData);
  const chunks = useCreation(() => chunk(nftData, pageSize), [nftData, pageSize]);
  const pages = chunks.length;
  const current = currentPage > pages ? 1 : currentPage;
  const page = chunks[current-1] || Array<NFTDataType>();
  const columns: ColumnProps<any>[] = [
    {
      title: 'NFT ID',
      width: 100,
      key: 'tokenId',
      render: (_: string, record: any) => <Box>{record.tokenId}</Box>,
    },
    {
      title: 'Metadata URL',
      key: 'image',
      render: (_: string, record: any) => {
        return <EllipsisText>{record.metadata.image}</EllipsisText>;
      },
    },
  ];
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };
  const loadingComponent = {
    spinning: loadingNftData,
    indicator: <Loading />,
  };
  const empty = !loadingNftData && !nftData.length;
  const renderEmpty = useCallback(
    () => <ListEmpty type="empty-billing" title="No NFT" desc="" empty={empty} h={274}></ListEmpty>,
    [empty],
  );
  return (
    <DCTable
      loading={loadingComponent}
      columns={columns}
      dataSource={page}
      current={currentPage}
      total={nftData.length}
      pageSize={PAGE_SIZE}
      showQuickJumper={true}
      pageChange={onPageChange}
      renderEmpty={renderEmpty}
    />
  );
};
