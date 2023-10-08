import { reportEvent } from '@/utils/reportEvent';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function GAPageView() {
  const { isReady, pathname, asPath } = useRouter();

  useEffect(() => {
    if (isReady) {
      let name = '';

      switch (true) {
        case pathname === '/share':
          name = 'dc.shared_ui.preview.all.pv';
          break;
        case pathname === '/':
          name = 'dc_lp.homepage.main.all.pv';
          break;
        case /\/buckets$/gi.test(asPath):
          name = 'dc.bucket.main.all.pv';
          break;
        case /\/buckets\/.*/gi.test(asPath):
          name = 'dc.file.main.all.pv';
          break;
        case /\/wallet$/gi.test(asPath):
        case /\/wallet\?type=transfer_in/gi.test(asPath):
          name = 'dc.wallet.transferin.all.pv';
          break;
        case /\/wallet\?type=transfer_out/gi.test(asPath):
          name = 'dc.wallet.transferout.all.pv';
          break;
        case /\/wallet\?type=send/gi.test(asPath):
          name = 'dc.wallet.send.all.pv';
          break;
        case /\/pricing-calculator$/gi.test(asPath):
          name = 'dc_lp.calculator.main.all.pv';
          break;
        case /\/pricing-calculator\/.*/gi.test(asPath):
          name = 'dc_lp.calculator.main.all.pv';
          break;
      }

      reportEvent({
        name,
      });
    }
  }, [asPath, isReady, pathname]);

  return <></>;
}
