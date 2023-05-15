import React, { ReactNode, useContext, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useVirtual } from '@tanstack/react-virtual';
import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonSquare,
  Text,
  toast,
  useDisclosure,
} from '@totejs/uikit';
import { useWindowSize } from 'react-use';
import { getUserBuckets } from '@bnb-chain/greenfield-storage-js-sdk';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';

import FileIcon from '@/public/images/icons/file.svg';
import MenuIcon from '@/public/images/icons/menu.svg';
import { makeData } from './makeData';
import { NewBucket } from './NewBucket';
import { Empty } from '@/modules/buckets/List/components/Empty';
import { useLogin } from '@/hooks/useLogin';
import { DeleteBucket } from '@/modules/buckets/List/components/DeleteBucket';
import { BucketDetail } from '@/modules/buckets/List/components/BucketDetail';
import { SPContext } from '@/context/GlobalContext/SPProvider';
import { formatTime, getMillisecond } from '../../utils/formatTime';
import { getQuota } from '@/modules/file/utils';
import { getBucketInfo, getStorageProviders } from '@/utils/sp';
import { GAClick, GAShow } from '@/components/common/GATracker';

export const TableList = () => {
  const { sp, sps } = useContext(SPContext);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useWindowSize();
  const {
    loginState: { address },
  } = useLogin();
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

  const tableFullHeight = useMemo(() => {
    return height - 65 - 48 - 24 - 48;
  }, [height]);

  const skeletonData = makeData(Math.floor(tableFullHeight / 56) - 1);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'bucket_name',
        header: 'Name',
        size: 360,
        cell: (info: any) => (
          <Flex alignItems={'center'} mr={'8px'}>
            <Box width={'24px'}>
              <FileIcon color="inherit" />
            </Box>
            <Text
              marginX={'4px'}
              overflow={'hidden'}
              textOverflow={'ellipsis'}
              whiteSpace={'nowrap'}
              color="inherit"
              fontWeight={500}
            >
              {info.getValue()}
            </Text>
          </Flex>
        ),
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
          const {
            row: { original: rowData },
          } = info;
          return (
            <Flex position="relative" gap={4} justifyContent="flex-end" alignItems={'center'}>
              <Menu offset={[-12, 0]} placement="bottom-start" trigger="hover" strategy="fixed">
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      // avoid the menu button to affect other layers
                      position={'static'}
                      boxSize={24}
                      display={'flex'}
                      justifyContent={'center'}
                      alignItems={'center'}
                      onClick={(e) => e.stopPropagation()}
                      as={'div'}
                      cursor="pointer"
                      bgColor={isOpen ? 'rgba(0, 186, 52, 0.1)' : 'transparent'}
                      color={isOpen ? 'readable.brand6' : 'readable.normal'}
                      borderRadius={18}
                      transitionProperty="colors"
                      transitionDuration="normal"
                      _hover={{
                        bgColor: 'rgba(0, 186, 52, 0.2)',
                        color: 'readable.brand6',
                      }}
                    >
                      <MenuIcon />
                    </MenuButton>
                    <MenuList w={'120px'}>
                      <GAShow name="dc.bucket.list_menu.0.show" isShow={isOpen} />
                      <GAClick name="dc.bucket.list_menu.detail.click">
                        <MenuItem
                          _hover={{
                            color: 'readable.brand7',
                            backgroundColor: 'rgba(0, 186, 52, 0.1)',
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setShowDetail(true);
                            onOpen();
                            setRowData(rowData);
                            setQuotaData(null);
                            const spIndex = sps.findIndex(function (item: any) {
                              return item.operatorAddress === rowData?.primary_sp_address;
                            });
                            if (spIndex < 0) {
                              toast.error({
                                description: `Sp address info is mismatched, please retry.`,
                              });
                              return;
                            }
                            const currentEndpoint = sps[spIndex]?.endpoint;
                            const currentQuotaData = await getQuota(
                              rowData.bucket_name,
                              currentEndpoint,
                            );
                            setQuotaData(currentQuotaData);
                          }}
                        >
                          <Text fontWeight={500}>View Details</Text>
                        </MenuItem>
                      </GAClick>
                      <GAClick name="dc.bucket.list_menu.delete.click">
                        <MenuItem
                          _hover={{
                            color: 'readable.brand7',
                            backgroundColor: 'rgba(0, 186, 52, 0.1)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetail(false);
                            onOpen();
                            const curSp = sps.find(
                              (item: any) => item.operatorAddress === rowData.primary_sp_address,
                            );
                            setRowData({ ...rowData, spEndpoint: curSp?.endpoint });
                          }}
                        >
                          <Text fontWeight={500}>Delete</Text>
                        </MenuItem>
                      </GAClick>
                    </MenuList>
                  </>
                )}
              </Menu>
            </Flex>
          );
        },
      },
    ],
    [onOpen, sps],
  );
  const isLoadingColumns = columns.map((column) => ({
    ...column,
    cell: <SkeletonSquare style={{ width: '80%' }} />,
  }));
  let { data, isLoading, refetch } = useQuery<any>(
    ['getBucketList'],
    async () => {
      const res: any = await getUserBuckets({
        address: address,
        endpoint: sp?.endpoint,
      });
      const data =
        res.body
          .filter((item: any) => !item.removed)
          .map((item: any) => {
            return item.bucket_info;
          }) ?? [];

      return data;
    },
    { enabled: !isEmpty(sp) },
  );

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tableNotFullHeight = data?.length * 56 + 45;

  return (
    <Box width={containerWidth} minW="">
      <Flex justifyContent={'flex-end'}>
        <NewBucket
          refetch={() => refetch()}
          marginTop="-20px"
          gaClickName="dc.bucket.list.newbucket.click"
        />
      </Flex>
      <Box
        className="container"
        borderRadius={'16px'}
        height={tableNotFullHeight < tableFullHeight ? tableNotFullHeight : tableFullHeight}
        paddingX="16px"
        border="none"
        backgroundColor={'#fff'}
        ref={tableContainerRef}
      >
        <Box
          as="table"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            th: {
              h: 44,
              fontWeight: 500,
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
            {table.getHeaderGroups().map((headerGroup) => (
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
          sp={{ address: rowData.primary_sp_address, endpoint: rowData.spEndpoint }}
        />
      )}
    </Box>
  );
};
