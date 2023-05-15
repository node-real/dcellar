export const removeTrailingSlash = (url: string) => {
  const regex = /\/+$/;
  return url.replace(regex, '');
};
