import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export const getMillisecond = (second: number) => {
  return second * 1000;
};

export const getTimestamp = () => {
  return +new Date();
}

export const getTimestampInSeconds = () => {
  return Math.floor(+new Date() / 1000);
}

export const convertTimeStampToDate = (utcTimestamp: number) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  // utc-0 timezone
  const tz = 'Iceland';

  return dayjs(utcTimestamp).tz(tz).format();
};

export const formatTime = (utcZeroTimestamp = 0) => {
  if (String(utcZeroTimestamp).length !== 13) {
    return '--'
  }
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const curTimezone = dayjs.tz.guess();
  const zeroToCurTimezone = dayjs(utcZeroTimestamp).tz(curTimezone);
  const now = dayjs();

  if (zeroToCurTimezone.isSame(now, 'day')) {
    return zeroToCurTimezone.format('HH:mm A');
  }

  return zeroToCurTimezone.format('MMM D, YYYY');
};

export const formatFullTime = (
  utcZeroTimestamp = 0,
  format?: 'MMM D, YYYY HH:mm A' | 'YYYY-MM-DD HH:mm:ss',
) => {
  if (String(utcZeroTimestamp).length !== 13) {
    return '--'
  }
  const formatStyle = format || 'MMM D, YYYY HH:mm A';
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const curTimezone = dayjs.tz.guess();

  return `${dayjs(utcZeroTimestamp).tz(curTimezone).format(formatStyle)} (UTC${dayjs(
    utcZeroTimestamp,
  )
    .tz(curTimezone)
    .format('Z')})`;
};

export const getUTC0Month = () => {
  dayjs.extend(utc);

  return `${dayjs().utc().format('YYYY.MM')} (UTC${dayjs.utc().format('Z')})`;
}

export const getUTC0FullMonth = () => {
  dayjs.extend(utc);

  return `${dayjs().utc().startOf('M').format('MMM D')} - ${dayjs().utc().endOf('M').format('MMM DD, YYYY')}`
}