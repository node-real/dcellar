import { AxiosRequestConfig } from 'axios';
import * as flatted from 'flatted';
import querystring from 'querystring';

export const getRequestId = (config: AxiosRequestConfig): string => {
  if (!config || typeof config !== 'object') {
    console.error('Invalid or empty config object in getRequestId');
    return '';
  }

  const { url, method, params, data } = config;

  if (!url || !method) {
    console.error('Missing required fields (url or method) in getRequestId');
    return '';
  }

  const parts = [encodeURIComponent(url), method];

  if (params !== undefined) {
    parts.push(querystring.stringify(params));
  }

  try {
    const dataString = typeof data === 'string' ? data : flatted.stringify(data);
    parts.push(querystring.stringify({ data: dataString }));
  } catch (error) {
    console.error('Parsing error in getRequestId:', error);
    parts.push(querystring.stringify({ data: String(data) }));
  }

  return parts.join('&');
};
