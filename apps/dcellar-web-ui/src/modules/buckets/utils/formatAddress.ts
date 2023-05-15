export const formatAddress = (address: string) => {
  const prefix = address.slice(0, 15);
  const suffix = address.slice(-13);
  const middle = '...';

  return `${prefix}${middle}${suffix}`;
};
