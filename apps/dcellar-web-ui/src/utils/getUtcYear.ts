import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export const getUtcYear = () => {
  dayjs.extend(utc);

  return dayjs().utc().format('YYYY');
};
