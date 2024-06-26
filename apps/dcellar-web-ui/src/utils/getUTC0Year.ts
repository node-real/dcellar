import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export const getUTC0Year = () => {
  dayjs.extend(utc);

  return dayjs().utc().format('YYYY');
};
