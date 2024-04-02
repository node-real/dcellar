import * as flatted from 'flatted';

// https://developers.google.com/tag-platform/gtagjs/reference
export type TGtagCommand = 'config' | 'set' | 'get' | 'event' | 'consent';

export interface IReportEvent {
  command?: TGtagCommand;
  name: string;
  data?: { [key: string]: string };
  setData?: { [key: string]: string };
}

export const getGtag = () => (window as any).gtag;

// https://developers.google.com/tag-platform/gtagjs/configure
export function reportEvent({ command = 'event', name, data = {} }: IReportEvent) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag(command, name, data);

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.log('[report] %c%s', 'color:#f00', name, `data=${flatted.stringify(data)}`);
  }
}
