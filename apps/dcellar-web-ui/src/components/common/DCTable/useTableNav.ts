import { SorterType } from '@/store/slices/persist';
import { useCreation } from 'ahooks';
import { chunk, reverse, sortBy } from 'lodash-es';

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
  const page = chunks[current] || Array<T>();
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
