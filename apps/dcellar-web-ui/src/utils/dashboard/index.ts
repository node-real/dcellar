import { BN } from '../math';
import { formatDateUTC } from '../time';

export function formatChartTime(time: string | number) {
  return formatDateUTC(time, 'dddd, MMM DD, YYYY');
}

/**
 * Merge two string arrays, add elements at corresponding positions, and return a new array
 * @param {string[]} arr1 - The first string array
 * @param {string[]} arr2 - The second string array
 * @returns {string[]} - The merged new array
 */
export const mergeArr = (arr1: string[], arr2: string[]) => {
  const diffLen = arr1.length - arr2.length;
  const sameLenArr1 = diffLen >= 0 ? arr1 : new Array(Math.abs(diffLen)).fill(0).concat(arr1);
  const sameLenArr2 = diffLen > 0 ? new Array(diffLen).fill(0).concat(arr2) : arr2;

  return sameLenArr1.map((item, index) =>
    BN(item)
      .plus(sameLenArr2[index] || 0)
      .toString(),
  );
};
