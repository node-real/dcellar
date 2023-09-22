import { CookiePolicy, TCookieOperate, TCookieType } from '../CookiePolicy';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { GA_ID } from '@/base/env';
import { forbidGaReport, forbidStReport, startGaReport, startStReport } from './utils';
import { GAShow } from '../common/GATracker';

const EXCLUDE_ROUTE_PATH_LIST = ['/terms'];
const GA_STORAGE_KEY = 'gaTrackingAccept';
const ST_STORAGE_KEY = 'stTrackingAccept';

export const CookiePolicyContainer = () => {
  const [show, setShow] = useState(false);
  const { pathname } = useRouter();
  const noShow = EXCLUDE_ROUTE_PATH_LIST.includes(pathname);

  const getCookieAccepted = (key: string) => {
    if (typeof window === 'undefined') return 'pending';

    const value = window.localStorage.getItem(key);
    const status = value === null ? 'pending' : value === 'true' ? true : false;

    return status;
  };

  useEffect(() => {
    const gaAccepted = getCookieAccepted(GA_STORAGE_KEY);
    const stAccepted = getCookieAccepted(ST_STORAGE_KEY);
    setShow(false);
    if (gaAccepted === 'pending' || stAccepted === 'pending') {
      setShow(true);
      forbidStReport();
      forbidGaReport(GA_ID);
      return;
    }
    if (gaAccepted && stAccepted) {
      startStReport();
      startGaReport(GA_ID);
      return;
    }
    if (gaAccepted && !stAccepted) {
      forbidStReport();
      startGaReport(GA_ID);
      return;
    }
    if (!gaAccepted && stAccepted) {
      startStReport();
      forbidGaReport(GA_ID);
      return;
    }
    if (!gaAccepted && !stAccepted) {
      forbidStReport();
      forbidGaReport(GA_ID);
      return;
    }
  }, []);

  const onClose = useCallback((type: TCookieType, operate: TCookieOperate) => {
    if (operate === 'close') {
      setShow(false);
      return;
    }
    if (operate === 'accept_all' || (operate === 'optional' && type === 'ga_st')) {
      localStorage.setItem(GA_STORAGE_KEY, 'true');
      localStorage.setItem(ST_STORAGE_KEY, 'true');
      startStReport();
      startGaReport(GA_ID);
      setShow(false);
      return;
    }
    if (operate === 'deny_all') {
      localStorage.setItem(GA_STORAGE_KEY, 'false');
      localStorage.setItem(ST_STORAGE_KEY, 'false');
      forbidStReport();
      forbidGaReport(GA_ID);
      setShow(false);
      return;
    }
    if (operate === 'optional' && type === 'ga') {
      localStorage.setItem(GA_STORAGE_KEY, 'true');
      localStorage.setItem(ST_STORAGE_KEY, 'false');
      forbidStReport();
      startGaReport(GA_ID);
      setShow(false);
      return;
    }
    if (operate === 'optional' && type === 'st') {
      localStorage.setItem(GA_STORAGE_KEY, 'false');
      localStorage.setItem(ST_STORAGE_KEY, 'true');
      startStReport();
      forbidGaReport(GA_ID);
      setShow(false);
      return;
    }
  }, []);

  return (
    <GAShow name="dc_lp.main.cookie.banner.show">
      {show && !noShow && <CookiePolicy onClose={onClose} />}
    </GAShow>
  );
};
