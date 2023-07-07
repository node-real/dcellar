export const isActivePath = (
  currentPath: string,
  path: string,
  basePath = '',
  enablePrefix = false,
) => {
  if (currentPath === '/') {
    return basePath ? path?.endsWith(basePath) : false;
  }
  if (enablePrefix) {
    return currentPath.includes(path);
  }

  return path?.endsWith(basePath + currentPath);
};
