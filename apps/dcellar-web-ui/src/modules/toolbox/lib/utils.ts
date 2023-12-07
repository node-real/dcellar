export const getNftHttpUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
    return IPFS_GATEWAY + url.substring(7);
  }
  return url;
}