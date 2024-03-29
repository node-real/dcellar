const localhostDomains = ['localhost', '127.0.0.1', '::1'];

export function validateReferer(referrer: string, allowedDomains: string) {
  if (!referrer) {
    return false;
  }
  const domain = new URL(referrer).hostname;
  const domains = allowedDomains.split(',').concat(localhostDomains);

  return domains.includes(domain);
}
