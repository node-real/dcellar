import { DCTable } from '@/components/common/DCTable';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { ColumnProps } from 'antd/es/table';
import React, { memo, useCallback } from 'react';
import { Text } from '@node-real/uikit';

const emptyArr: string[] = [];
const columns: ColumnProps<any>[] = [
  {
    title: 'Time',
    key: 'timestamp',
  },
  {
    title: 'Type',
    key: 'address',
  },
  {
    title: 'Total Cost',
    key: 'totalCost',
  },
  {
    title: 'Flow Rate',
    key: 'netflowRate',
  },
].map((col) => ({ ...col, dataIndex: col.key }));;

export const ComingBillingHistory = memo(function ComingBillingHistory() {
  const renderEmpty = useCallback(
    () => (
      <ListEmpty
        type="discontinue"
        title=""
        desc=""
        empty={true}
        h={274}
      >
      <Text mt={16} fontSize={14} color={'readable.tertiary'}>Coming Soon...</Text>
      </ListEmpty>
    ),
    [],
  );
  return (
    <DCTable
      rowKey='key'
      columns={columns}
      dataSource={emptyArr}
      renderEmpty={renderEmpty}
      pageSize={0}
      canNext={false}
      canPrev={false}
      pagination={false}
    />
  );
});
