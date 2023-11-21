import { formatDateUTC } from '../time'

export const formatChartTime = (time: string) => {
  return formatDateUTC(time, 'DD MMM')
}