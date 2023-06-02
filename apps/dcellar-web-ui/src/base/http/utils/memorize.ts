let cache: any = {};

export const memorize = ({ fn, scope='default', expirationMs }: { fn: Function, scope?: string, expirationMs?: number}) => {
  return async function ({ ...args }: any) {
    const argStr = JSON.stringify(args);
    const curTime = Date.now();

    if (expirationMs && cache[scope] && cache[scope][argStr] && curTime - cache[scope][argStr].timestamp > expirationMs ) {
      delete cache[scope][argStr];
    }

    cache[scope] = cache[scope] || {};
    const res = cache[scope][argStr] && cache[scope][argStr]['res'] || await fn.apply(fn, [args])
    cache[scope][argStr] = {
      timestamp: Date.now(),
      res,
    }

    return cache[scope][argStr]['res'];
  };
};

memorize.clear = (scope = 'default') => {
  cache[scope] = {};
};

memorize.clearAll = () => {
  cache = {};
};

memorize.getCacheList = () => {
  return { ...cache };
};
