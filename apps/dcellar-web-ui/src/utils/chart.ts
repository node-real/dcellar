import { formatDateUTC } from './time';

export function formatChartXAxisTime(time: string) {
  return formatDateUTC(time, 'MMM DD');
}

export const getNoDataOptions = () => {
  return
}