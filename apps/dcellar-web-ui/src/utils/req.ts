const validLocalhostDomains: readonly string[] = ['localhost', '127.0.0.1', '::1'];

export function isRefererAllowed(referrerURL: string, allowedDomainList: string): boolean {
  console.log('referrerURL:', referrerURL);
  if (!referrerURL) {
    return false;
  }

  const domain = new URL(referrerURL).hostname;
  const domains = allowedDomainList
    .split(',')
    .map((domain) => domain.trim())
    .concat(validLocalhostDomains);

  console.error('domain:', domain);
  console.error('domains:', domains);
  console.error(
    'domains.some:',
    domains.some((allowedDomain) => domain.endsWith(allowedDomain)),
  );

  return domains.some((allowedDomain) => domain.endsWith(allowedDomain));
}
