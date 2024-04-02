import { Mutex } from 'async-mutex';
import { isEmpty } from 'lodash-es';

export interface ICancelManagerOptions {
  debug?: boolean;
}

export interface ICancelManagerPendingRequests {
  [key: string]: (reason: string) => void;
}

export default class CancelManager {
  options: ICancelManagerOptions;
  pendingRequests: ICancelManagerPendingRequests;
  mutex: Mutex;

  constructor(options: ICancelManagerOptions = {}) {
    this.options = options;
    this.pendingRequests = {};
    this.mutex = new Mutex();
  }

  async addRequest(requestId: string, cancelFn: (reason: string) => void) {
    const release = await this.mutex.acquire();
    try {
      if (typeof requestId !== 'string' || typeof cancelFn !== 'function') {
        throw new Error(
          'Invalid arguments. requestId must be a string and cancelFn must be a function.',
        );
      }

      this.log(`adding request ${requestId}`);

      if (this.has(requestId)) {
        this.cancelRequest(
          requestId,
          `\`cancelRequest(${requestId})\` from \`RequestManager.addRequest\`.
        Found duplicate pending request.`,
        );
      }

      this.pendingRequests[requestId] = cancelFn;
    } finally {
      release();
    }
  }

  async removeRequest(requestId: string) {
    const release = await this.mutex.acquire();
    try {
      if (!requestId) return;

      if (typeof requestId !== 'string') {
        throw new Error('Invalid argument. requestId must be a string.');
      }

      this.log(`removing request ${requestId}`);

      delete this.pendingRequests[requestId];
    } finally {
      release();
    }
  }

  async cancelRequest(
    requestId: string,
    reason = `cancelRequest(${requestId}) from RequestManager.cancelRequest`,
  ) {
    const release = await this.mutex.acquire();
    try {
      if (!this.has(requestId)) return;

      if (typeof this.pendingRequests[requestId] !== 'function') {
        throw new Error(`Request ${requestId} not found.`);
      }

      this.log(`cancelling request ${requestId}`);

      this.pendingRequests[requestId](reason);
      delete this.pendingRequests[requestId];

      this.log(`request ${requestId} cancelled`);
    } finally {
      release();
    }
  }

  async cancelAllRequests(reason: string) {
    const requestIds = Object.keys(this.pendingRequests);
    for (const requestId of requestIds) {
      await this.cancelRequest(requestId, reason);
    }
  }

  has(requestId: string) {
    if (typeof requestId !== 'string') {
      throw new Error('Invalid argument. requestId must be a string.');
    }

    return !isEmpty(this.pendingRequests[requestId]);
  }

  log(message: string) {
    if (this.options.debug === true) {
      console.log(message);
    }
  }
}
