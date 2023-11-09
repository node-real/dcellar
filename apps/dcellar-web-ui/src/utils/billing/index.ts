import { cssVar } from '../common';
import { BN } from '../math';

export const getMoM = (preCost: string, curCost: string) => {
  const preCostIsZero = !preCost || BN(preCost).isEqualTo(0);
  const curCostIsZero = !curCost || BN(curCost).isEqualTo(0);
  if (preCostIsZero && curCostIsZero || preCostIsZero) {
    return 0
  }

  return (BN(curCost).minus(preCost || 0)).dividedBy(preCost).multipliedBy(100).dp(2).toNumber();
}
export const getStyles = () => {
  return {
    box: `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `,
    total: `
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      gap: 4px;
      color: ${cssVar('readable.secondary')};
    `,
    normal: `
      display: flex;
      align-items: center;
      font-size: 12px;
      gap: 4px;
      color: ${cssVar('readable.secondary')};
    `,
    bnb: `
      color: ${cssVar('readable.normal')};
      font-weight: 500;
    `,
  };
}
