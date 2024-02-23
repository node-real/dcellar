import { AxiosRequestConfig } from 'axios';

export const genRequestId = (config: AxiosRequestConfig): string => {
  const { url, method, params, data } = config;
  const parts = [url, method];
  parts.push(JSON.stringify(params));

  try {
    parts.push(typeof data === 'string' ? JSON.stringify(JSON.parse(data)) : JSON.stringify(data));
  } catch (error) {
    console.error('Parsing error in genRequestId:', error);
    parts.push(JSON.stringify(data));
  }

  return parts.join('&');
};
