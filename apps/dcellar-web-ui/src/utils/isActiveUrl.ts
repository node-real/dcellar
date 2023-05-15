export const isActiveUrl = (
  currentLink: string,
  link: string,
  basePath = '',
  enablePrefix = false,
) => {
  if (currentLink === link) return true;

  if (currentLink === '/') {
    return basePath ? link?.endsWith(basePath) : false;
  }
  // if (link?.endsWith('/*')) {
  if (enablePrefix) {
    return currentLink.includes(link);
  }
  return link?.endsWith(basePath + currentLink);
};
