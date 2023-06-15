import dayjs from 'dayjs';

export type Bucket = {
  id: number;
  name: string;
  created_time: string;
};

export type PersonApiResponse = {
  data: Bucket[];
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

const newPerson = (index: number): Bucket => {
  const time = dayjs().valueOf() - index * 1000 * 60 * 60 * 1;
  return {
    id: index + 1,
    name: 'fakeName',
    created_time: dayjs(time).format('MMM DD, YYYY'),
  };
};

export function makeData(len: number) {
  return range(len).map((d): Bucket => {
    return {
      ...newPerson(d),
    };
  });
}
