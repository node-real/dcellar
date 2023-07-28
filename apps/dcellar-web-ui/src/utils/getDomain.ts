export const getDomain = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.origin;
};