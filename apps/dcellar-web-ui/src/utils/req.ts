const validLocalhostDomains: readonly string[] = ['localhost', '127.0.0.1', '::1'];

export function isRefererAllowed(referrerURL: string, allowedDomainList: string): boolean {
  if (!referrerURL) {
    return false;
  }

  const domain = new URL(referrerURL).hostname;
  const domains = allowedDomainList
    .split(',')
    .map((domain) => domain.trim())
    .concat(validLocalhostDomains);

  return domains.some((allowedDomain) => domain.endsWith(allowedDomain));
}
