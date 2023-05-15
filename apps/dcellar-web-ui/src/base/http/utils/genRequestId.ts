import { AxiosRequestConfig } from 'axios';

export const genRequestId = (config: AxiosRequestConfig) => {
  let { url, method, params, data } = config;
  if (typeof data === 'string') data = JSON.parse(data);
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&');
};
