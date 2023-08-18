import { chunk, reverse, sortBy } from 'lodash-es';
import { SorterType } from '@/store/slices/persist';
import { useCreation } from 'ahooks';

type TableNavProps<T> = {
  list: Array<T>;
  sorter: SorterType;
  pageSize: number;
  currentPage: number;
};

export const useTableNav = <T>({ list, sorter, pageSize, currentPage }: TableNavProps<T>) => {
  const [sortName, dir] = sorter;
  const ascend = sortBy(list, sortName);
  const sortedList = dir === 'ascend' ? ascend : reverse(ascend);

  const chunks = useCreation(() => chunk(sortedList, pageSize), [sortedList, pageSize]);
  const pages = chunks.length;
  const current = currentPage >= pages ? 0 : currentPage;
  const page = chunks[current];
  const canNext = current < pages - 1;
  const canPrev = current > 0;

  return {
    dir,
    sortName,
    sortedList,
    page,
    canNext,
    canPrev,
  };
};
