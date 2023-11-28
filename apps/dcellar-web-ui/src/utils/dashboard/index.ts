import { formatDateUTC } from '../time'

export function formatChartXAxisTime(time: string | number) {
  return formatDateUTC(time, 'MMM DD');
}
export function formatChartTime(time: string | number) {
  return formatDateUTC(time, 'dddd, MMM DD, YYYY');
}

export const mergeArr = (arr1: string[], arr2: string[]) => {
  return arr1.map((item, index) => String(Number(item) + Number(arr2[index])))
}