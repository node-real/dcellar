export const getDomain = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.origin;
};

export const openLink = (link: string, target = '_blank') => {
  const a = document.createElement('a');
  a.href = link;
  a.target = target;
  a.click();
};
