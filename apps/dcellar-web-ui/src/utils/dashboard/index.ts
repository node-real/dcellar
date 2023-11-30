import { formatDateUTC } from '../time'

export function formatChartTime(time: string | number) {
  return formatDateUTC(time, 'dddd, MMM DD, YYYY');
}

export const mergeArr = (arr1: string[], arr2: string[]) => {
  const longArr = arr1.length >= arr2.length ? arr1 : arr2
  return longArr.map((_, index) => String(Number(arr1[index] || 0) + Number(arr2[index] || 0)))
}