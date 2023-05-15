import { get } from '@/base/http';

export const getBnbPrice = () =>
  get({ url: 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT' });
