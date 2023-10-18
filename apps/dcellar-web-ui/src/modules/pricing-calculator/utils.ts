import object from "@/store/slices/object";

export type TSize = 'MB' | 'GB' | 'TB';
export type TTime = 'd' | 'm' | 'y';
export const Sizes = {
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
};
export const Times = {
  d: 24 * 60 * 60,
  m: 30 * 24 * 60 * 60,
  y: 12 * 30 * 24 * 60 * 60,
};
export type TTimeOption = {
  value: string;
  id: string;
  unit: string;
  title: string;
  gaClickName?: string;
}
export const TimeOptions: TTimeOption[] = [
  {
    value: '6',
    id: '6d',
    unit: 'm',
    title: '6 months',
    gaClickName: 'dc_lp.calculator.time.6mo.click',
  },
  {
    id: '1y',
    value: '1',
    unit: 'y',
    title: '1 year',
    gaClickName: 'dc_lp.calculator.time.1yr.click',
  },
  {
    id: 'custom',
    value: '180',
    unit: 'd',
    title: 'Custom',
    gaClickName: 'dc_lp.calculator.time.custom.click',
  }
];

export const TimeUnits: {[key: string]: string}= {
  'd': 'Day',
  'm': 'Month',
  'y': 'Year'
}

export const swapObj = (obj: {[key: string]: string}) => {
  return Object.fromEntries(Object.entries(obj).map(a => a.reverse()))
}