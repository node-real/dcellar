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

  constructor(options = {}) {
    this.options = options;
    this.pendingRequests = {};
  }

  addRequest(requestId: string, cancelFn: (reason: string) => void) {
    this.log(`adding request ${requestId}`);

    if (this.has(requestId)) {
      this.cancelRequest(
        requestId,
        `\`cancelRequest(${requestId})\` from \`RequestManager.addRequest\`.
      Found duplicate pending request.`,
      );
      this.pendingRequests[requestId] = cancelFn;
    } else {
      this.pendingRequests[requestId] = cancelFn;
    }
  }

  removeRequest(requestId: string) {
    this.log(`removing request ${requestId}`);

    delete this.pendingRequests[requestId];
  }

  cancelRequest(
    requestId: string,
    reason = `cancelRequest(${requestId}) from RequestManager.cancelRequest`,
  ) {
    this.log(`cancelling request ${requestId}`);

    if (this.has(requestId) && typeof this.pendingRequests[requestId] === 'function') {
      this.pendingRequests[requestId](reason);
      this.removeRequest(requestId);

      this.log(`request \`${requestId}\` cancelled`);
    }

    this.log(`request ${requestId} cancelled`);
  }

  cancelAllRequests(reason: string) {
    for (const requestId in this.pendingRequests) {
      const _reason = reason || `cancelRequest(${requestId}) from RequestManager.cancelAllRequests`;
      this.cancelRequest(requestId, _reason);
    }
  }

  has(requestId: string) {
    return !isEmpty(this.pendingRequests[requestId]);
  }

  log(message: string) {
    if (this.options.debug === true) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
}
