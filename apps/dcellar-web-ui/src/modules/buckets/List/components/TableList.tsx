import React, { memo, ReactNode, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtual } from '@tanstack/react-virtual';
import { Box, Flex, SkeletonSquare, Text, useDisclosure } from '@totejs/uikit';
import { useWindowSize } from 'react-use';
import { useRouter } from 'next/router';

import { makeData } from './makeData';
import { NewBucket } from './NewBucket';
import { Empty } from '@/modules/buckets/List/components/Empty';
import { DeleteBucket } from '@/modules/buckets/List/components/DeleteBucket';
import { BucketDetail } from '@/modules/buckets/List/components/BucketDetail';
import { formatTime, getMillisecond } from '@/utils/time';
import { ActionItem } from './ActionItem';
import { BucketNameItem } from './BucketNameItem';
import { DiscontinueBanner } from '@/components/common/DiscontinueBanner';
import { DISCONTINUED_BANNER_HEIGHT, DISCONTINUED_BANNER_MARGIN_BOTTOM } from '@/constants/common';

export const TableList = memo(() => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useWindowSize();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [rowData, setRowData] = useState<any>();
  const [showDetail, setShowDetail] = useState(false);
  const [quotaData, setQuotaData] = useState<{
    freeQuota: number;
    readQuota: number;
    consumedQuota: number;
  } | null>(null);
  const router = useRouter();

  const containerWidth = useMemo(() => {
    const newWidth = width > 1000 ? width : 1000;

    return newWidth - 269 - 24 - 24;
  }, [width]);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'bucket_name',
        header: 'Name',
        size: 360,
        cell: (info: any) => <BucketNameItem info={info} />,
      },
      {
        accessorKey: 'create_at',
        cell: (info) => (
          <Text color={'readable.normal'} _hover={{ color: 'readable.normal' }}>
            {formatTime(getMillisecond(info.getValue() as number)) as ReactNode}
          </Text>
        ),
        header: () => 'Date Created',
        size: 120,
      },
      {
        accessorKey: 'action',
        header: () => 'Action',
        size: 60,
        cell: (info) => {
          return (
            <ActionItem
              info={info}
              rowData={rowData}
              setShowDetail={setShowDetail}
              setRowData={setRowData}
              setQuotaData={setQuotaData}
              onOpen={onOpen}
            />
          );
        },
      },
    ],
    [onOpen, rowData],
  );
  const isLoadingColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        cell: <SkeletonSquare style={{ width: '80%' }} />,
      })),
    [columns],
  );
  // todo remove Query
  let { data, isLoading, refetch } = {
    data: [],
    isLoading: false,
    refetch: () => {},
  };

  const hasContinuedBucket = useMemo(() => {
    return data?.some((item: any) => item.originalData.bucket_info.bucket_status === 1);
  }, [data]);

  const tableFullHeight = useMemo(() => {
    if (hasContinuedBucket) {
      return (
        height - 65 - 48 - 24 - 48 - DISCONTINUED_BANNER_HEIGHT - DISCONTINUED_BANNER_MARGIN_BOTTOM
      );
    }
    return height - 65 - 48 - 24 - 48;
  }, [hasContinuedBucket, height]);

  const tableNotFullHeight = useMemo(() => data?.length * 56 + 45, [data?.length]);

  const skeletonData = useMemo(() => {
    return makeData(Math.floor(tableFullHeight / 56) - 1);
  }, [tableFullHeight]);

  const totalDBRowCount = 0;
  const table = useReactTable({
    data: isLoading ? skeletonData : data,
    // @ts-ignore
    columns: isLoading ? isLoadingColumns : columns,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 30,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0;

  if (totalDBRowCount === 0 && data?.length === 0 && !isLoading) {
    return <Empty refetch={() => refetch()} />;
  }

  return (
    <Box width={containerWidth} minW="">
      <Flex justifyContent={'flex-end'}>
        <NewBucket
          refetch={() => refetch()}
          marginTop="-20px"
          gaClickName="dc.bucket.list.newbucket.click"
        />
      </Flex>
      {hasContinuedBucket && (
        <DiscontinueBanner
          content="Some items were marked as discontinued and will be deleted by SP soon. Please backup your data in time. "
          height={DISCONTINUED_BANNER_HEIGHT}
          marginBottom={DISCONTINUED_BANNER_MARGIN_BOTTOM}
        />
      )}
      <Box
        overflowY="auto"
        maxW={'100%'}
        borderRadius={'16px'}
        height={tableNotFullHeight < tableFullHeight ? tableNotFullHeight : tableFullHeight}
        paddingX="16px"
        border="none"
        backgroundColor={'#fff'}
        // ref={tableContainerRef}
      >
        <Box
          as="table"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            th: {
              h: 44,
              fontWeight: 600,
              fontSize: 12,
              lineHeight: '18px',
              color: 'readable.tertiary',
            },
            'td, th': {
              px: 16,
              _last: {
                textAlign: 'right',
              },
            },
            'tbody > tr:last-child': {
              borderBottom: 'none',
            },
          }}
        >
          <Box
            as="thead"
            position={'sticky'}
            zIndex={1}
            margin="0"
            top="0"
            backgroundColor={'#fff'}
          >
            {table.getHeaderGroups().map((headerGroup, index) => (
              <Box as="tr" key={headerGroup.id} borderBottom="1px solid #E6E8EA">
                {headerGroup.headers.map((header) => {
                  return (
                    <Box
                      as="th"
                      key={header.id}
                      colSpan={header.colSpan}
                      width={header.getSize()}
                      textAlign="left"
                      height={'44px'}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
          <Box as="tbody">
            {paddingTop > 0 && (
              <Box as="tr">
                <td style={{ height: `${paddingTop}px` }} />
              </Box>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<any>;
              return (
                <Box
                  as="tr"
                  cursor={'pointer'}
                  key={row.id}
                  color="readable.normal"
                  _hover={{
                    backgroundColor: isLoading ? 'transparent' : 'rgba(0, 186, 52, 0.1)',
                    color: 'readable.brand7',
                  }}
                  onClick={() => router.push(`/buckets/${row.original.bucket_name}`)}
                  borderBottom="1px solid #E6E8EA"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Box as="td" height={'56px'} key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
            {paddingBottom > 0 && (
              <Box as="tr">
                <td style={{ height: `${paddingBottom}px` }} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {showDetail && isOpen && (
        <BucketDetail rowData={rowData} isOpen={isOpen} onClose={onClose} quotaData={quotaData} />
      )}
      {!showDetail && isOpen && (
        <DeleteBucket
          refetch={() => refetch()}
          isOpen={isOpen}
          onClose={onClose}
          bucketName={rowData.bucket_name}
          sp={{
            address: rowData.originalData.bucket_info.primary_sp_address,
            endpoint: rowData.spEndpoint,
          }}
        />
      )}
    </Box>
  );
});
