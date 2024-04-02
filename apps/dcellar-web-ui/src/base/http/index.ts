import { toast } from '@node-real/uikit';
import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import qs from 'query-string';
import * as flatted from 'flatted';

import CancelManager from './cancel/cancelManager';
import { errorCodes, TErrorCodeKey } from './utils/errorCodes';
import { getRequestId } from './utils/getRequestId';

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
  data?: object;
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
  const requestId = customOptions?.requestId || getRequestId({ ...options, url });
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
      const code = e.code || (e.response && e.response.code) || e.response?.status;
      const message =
        errorCodes[code as TErrorCodeKey] ||
        e.response?.msg ||
        e?.msg ||
        'Internal error. Please try again later.';

      if (needNotify && e?.code !== 'ECONNABORTED' && e.response && e.response.status !== 401) {
        toast.error({ description: `Operation failed. Error message: ${message}.` });
        console.error(`Operation failed. Error message: ${message}.`);
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
  const _url = data ? `${url}?${qs.stringify(data, { arrayFormat: 'comma' })}` : url;

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
      data: data ? flatted.stringify(data) : null,
    },
    customOptions,
  });

const put = ({ url, data, options, customOptions }: CustomRequestOptions) =>
  request({
    url,
    options: {
      ...options,
      method: 'PUT',
      data: data ? flatted.stringify(data) : null,
    },
    customOptions,
  });

const del = ({ url, data, options, customOptions }: CustomRequestOptions) =>
  request({
    url,
    options: {
      ...options,
      method: 'DELETE',
      data: data ? flatted.stringify(data) : null,
    },
    customOptions,
  });

export { cancelAllRequest, cancelRequest, del, get, post, put, request };

export default request;
