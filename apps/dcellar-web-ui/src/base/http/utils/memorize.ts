let cache: any = {};
export const memorize = (fn: Function, scope = 'default') => {
  return function ({ ...args }: any): any {
    cache[scope] = cache[scope] || {};
    const argStr = JSON.stringify(args);
    cache[scope][argStr] = cache[scope][argStr] || fn.apply(fn, [args]);

    return cache[scope][argStr];
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
