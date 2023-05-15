import { faker } from '@faker-js/faker';
import { ColumnSort, SortingState } from '@tanstack/react-table';
import dayjs from 'dayjs';

export type Person = {
  id: number;
  name: string;
  createdAt: string;
  size: string;
};

export type PersonApiResponse = {
  data: Person[];
  meta: {
    totalRowCount: number;
  };
};

const range = (len: number) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newPerson = (index: number): Person => {
  return {
    id: index + 1,
    name: faker.random.alpha(Math.ceil(Math.random() * 10 * 2)),
    size: `${Math.ceil(Math.random() * 10 * 100)}M`,
    // TODO according to utc-0 to calculate and compare
    createdAt: dayjs(
      faker.date.between('2020-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z'),
    ).format('MMM DD, YYYY'),
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!;
    return range(len).map((d): Person => {
      return {
        ...newPerson(d),
      };
    });
  };

  return makeDataLevel();
}

const data = makeData(20000);

export const fetchData = async (start: number, size: number, sorting: SortingState) => {
  const dbData = [...data];
  if (sorting.length) {
    const sort = sorting[0] as ColumnSort;
    const { id, desc } = sort as { id: keyof Person; desc: boolean };
    dbData.sort((a, b) => {
      if (desc) {
        return a[id] < b[id] ? 1 : -1;
      }
      return a[id] > b[id] ? 1 : -1;
    });
  }
  await new Promise((rs) => {
    setTimeout(() => {
      rs(1);
    }, 2000);
  });

  return {
    data: dbData.slice(start, start + size),
    meta: {
      totalRowCount: dbData.length,
    },
  };
};
