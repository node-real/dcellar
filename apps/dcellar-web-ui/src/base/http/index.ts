import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { toast } from '@totejs/uikit';
import qs from 'query-string';

import { genRequestId } from './utils/genRequestId';
import CancelManager from './cancel/cancelManager';
import { errorCodes, TErrorCodeKey } from './utils/errorCodes';

type TCustomOptions = {
  needNotify?: boolean;
  requestId?: string;
};

type RequestOptions = {
  url: string;
  options: AxiosRequestConfig;
  customOptions?: TCustomOptions;
};

type CustomRequestOptions = {
  url: string;
  data?: Object;
  options?: AxiosRequestConfig;
  customOptions?: TCustomOptions;
};

const requestManager = new CancelManager({ debug: false });

const instance = axios.create({
  timeout: 6000,
});

axiosRetry(instance, {
  retries: 3,
  shouldResetTimeout: true,
});

const cancelRequest = (requestId: string, reason: string) => {
  if (requestId) {
    requestManager.cancelRequest(requestId, reason);
  }
};

const cancelAllRequest = (reason: string) => {
  requestManager.cancelAllRequests(reason);
};

const request = ({ url, options, customOptions }: RequestOptions) => {
  const needNotify =
    customOptions && typeof customOptions.needNotify === 'boolean'
      ? customOptions.needNotify
      : true;
  const requestId = customOptions?.requestId || genRequestId({ ...options, url });
  const controller = new AbortController();

  instance.interceptors.request.use((config: any) => {
    config.headers = {
      ...config.headers,
    };
    requestManager.addRequest(requestId, () => controller.abort());

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      requestManager.removeRequest(requestId);

      return response;
    },
    (e: any) => {
      requestManager.removeRequest(requestId);

      return Promise.reject(e);
    },
  );

  return instance
    .request({
      url,
      ...options,
      signal: controller.signal,
    })
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }

      return Promise.reject(response.data);
    })
    .catch((e) => {
      if (e.response?.status === 401) {
        cancelAllRequest('Auto cancel all request!');
      }
      const code = e.code || (e.response && e.response.code) || e.response?.status;
      const message =
        errorCodes[code as TErrorCodeKey] ||
        e.response?.msg ||
        e?.msg ||
        'Internal error. Please try again later.';
      if (needNotify && e?.code !== 'ECONNABORTED' && e.response?.status !== 401) {
        toast.error({ description: `Failure, error message: ${message}` });
        // eslint-disable-next-line no-console
        console.error(`Failure, error message: ${message}`);
      }

      const err = {
        status: e.response?.status,
        code,
        message,
      };

      throw err;
    });
};

const get = ({ url, data, options, customOptions }: CustomRequestOptions) => {
  const _url = data ? `${url}?${qs.stringify(data)}` : url;

  return request({
    url: _url,
    options: { ...options, method: 'GET' },
    customOptions,
  });
};

const post = ({ url, data, options, customOptions }: CustomRequestOptions) =>
  request({
    url,
    options: {
      ...options,
      method: 'POST',
      data: data ? JSON.stringify(data) : null,
    },
    customOptions,
  });

const put = ({ url, data, options, customOptions }: CustomRequestOptions) =>
  request({
    url,
    options: {
      ...options,
      method: 'PUT',
      data: data ? JSON.stringify(data) : null,
    },
    customOptions,
  });

const del = ({ url, data, options, customOptions }: CustomRequestOptions) =>
  request({
    url,
    options: {
      ...options,
      method: 'DELETE',
      data: data ? JSON.stringify(data) : null,
    },
    customOptions,
  });

export { request, post, get, put, del, cancelRequest, cancelAllRequest };

export default request;
