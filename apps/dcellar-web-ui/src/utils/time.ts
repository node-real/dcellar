import moment from 'moment';

export const formatDateUTC = (date: number | string) => {
  return moment(date).format('MMM DD, YYYY HH:mm:ss A (UTC Z)');
};
