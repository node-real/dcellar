import { BN } from '../math';
import { formatDateUTC } from '../time'

export function formatChartTime(time: string | number) {
  return formatDateUTC(time, 'dddd, MMM DD, YYYY');
}

export const mergeArr = (arr1: string[], arr2: string[]) => {
  const diffLen = arr1.length - arr2.length;
  let sameLenArr1: string[] = [];
  let sameLenArr2: string[] = [];
  if (diffLen > 0) {
    sameLenArr1 = arr1;
    sameLenArr2 = new Array(diffLen).fill(0).concat(arr2);
  } else {
    sameLenArr2 = arr2;
    sameLenArr1 = new Array(diffLen).fill(0).concat(arr1);
  }

  return sameLenArr1.map((item, index) => BN(item).plus(sameLenArr2[index] || 0).toString());
}