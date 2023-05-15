import React, { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtual } from '@tanstack/react-virtual';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonSquare,
  Text,
} from '@totejs/uikit';
import { useWindowSize } from 'react-use';

import LoadingIcon from '@/public/images/icons/loading.svg';
import AddIcon from '@/public/images/icons/add.svg';
import FileIcon from '@/public/images/icons/file.svg';
import WarningIcon from '@/public/images/icons/warning.svg';
import MenuIcon from '@/public/images/icons/menu.svg';
import { fetchData, makeData, Person, PersonApiResponse } from './makeData';

const FETCH_SIZE = 30;

export const VirtualListDemo = () => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useWindowSize();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const containerWidth = useMemo(() => {
    return width - 269 - 24 - 24;
  }, [width]);

  const tableHeight = useMemo(() => {
    return height - 65 - 48 - 24 - 48;
  }, [height]);

  const skeletonData = makeData(Math.ceil(tableHeight / 56) - 1);

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 320,
        cell: (info: any) => (
          <Flex alignItems={'center'}>
            <FileIcon color="system.readable.secondary" />
            <Text marginX={'4px'}>{info.getValue()}</Text>
            <WarningIcon color="#EE3911" />
          </Flex>
        ),
      },
      {
        accessorKey: 'size',
        cell: (info) => info.getValue(),
        header: 'Size',
        size: 160,
      },
      {
        accessorKey: 'createdAt',
        cell: (info) => info.getValue(),
        header: () => <span>Date Created</span>,
        size: 160,
      },
      {
        accessorKey: 'action',
        header: () => 'Action',
        size: 120,
        cell: () => {
          // Get column property and values
          return (
            <Menu offset={[45, 0]}>
              <MenuButton width={50} as={'div'} cursor="pointer">
                <MenuIcon />
              </MenuButton>
              <MenuList w={'120px'}>
                <MenuItem>View Details</MenuItem>
                <MenuItem>Delete</MenuItem>
              </MenuList>
            </Menu>
          );
        },
      },
    ],
    [],
  );

  const isLoadingColumns = columns.map((column) => ({
    ...column,
    cell: <SkeletonSquare style={{ width: '80%' }} />,
  }));

  const { data, hasPreviousPage, fetchNextPage, isFetching, isLoading } =
    useInfiniteQuery<PersonApiResponse>(
      ['table-data', sorting],
      async ({ pageParam = 0 }) => {
        const start = pageParam * FETCH_SIZE;
        const fetchedData = await fetchData(start, FETCH_SIZE, sorting);
        return fetchedData;
      },
      {
        getNextPageParam: (_lastGroup, groups) => groups.length,
        keepPreviousData: true,
        refetchOnWindowFocus: false,
      },
    );

  const flatData = React.useMemo(() => data?.pages?.flatMap((page) => page.data) ?? [], [data]);
  const totalDBRowCount = data?.pages?.[0]?.meta?.totalRowCount ?? 0;
  const totalFetched = flatData.length;

  const fetchMoreOnBottomReached = React.useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (
          scrollHeight - scrollTop - clientHeight < 10 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  React.useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    data: isLoading && !hasPreviousPage ? skeletonData : flatData,
    // @ts-ignore
    columns: isLoading && !hasPreviousPage ? isLoadingColumns : columns,
    state: {
      sorting,
    },
    enableColumnResizing: true,
    onSortingChange: setSorting,
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

  return (
    <Box width={containerWidth}>
      {/*<Flex justifyContent={'flex-end'}>*/}
      {/*  <Button size={'md'} variant="brand" marginBottom={'12px'} marginTop="-20px">*/}
      {/*    <AddIcon color="#fff" ml="8px" />*/}
      {/*    New Bucket*/}
      {/*  </Button>*/}
      {/*</Flex>*/}
      <Box
        className="container"
        borderRadius={'16px'}
        height={tableHeight}
        paddingX="16px"
        backgroundColor={'#fff'}
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        ref={tableContainerRef}
      >
        <Box
          as="table"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            backgroundColor: '#fff',
          }}
        >
          <Box as="thead" position={'sticky'} margin="0" top="0" backgroundColor={'#fff'}>
            {table.getHeaderGroups().map((headerGroup) => (
              <Box as="tr" key={headerGroup.id}>
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
              const row = rows[virtualRow.index] as Row<Person>;
              return (
                <Box
                  as="tr"
                  key={row.id}
                  _hover={{
                    backgroundColor: 'rgba(0, 186, 52, 0.1)',
                  }}
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
        {(isFetching || isLoading) && (
          <Flex width={'100%'} justifyContent={'center'}>
            <LoadingIcon color="#00BA34" />
          </Flex>
        )}
      </Box>
      <div>
        Fetched {flatData.length} of {totalDBRowCount} Rows.
      </div>
    </Box>
  );
};
