import { smMedia } from '@/modules/responsive';
import { Link, LinkProps, Text, TextProps } from '@node-real/uikit';

export const H1 = ({ children, ...restProps }: TextProps) => (
  <Text
    as="h1"
    fontSize={40}
    fontWeight={700}
    margin={'0 auto 16px'}
    sx={{
      [smMedia]: {
        fontSize: '24px',
        textAlign: 'left',
      },
    }}
    {...restProps}
  >
    {children}
  </Text>
);

export const SubTitle = ({ children, ...restProps }: TextProps) => (
  <Text
    as="h2"
    fontSize={16}
    sx={{
      [smMedia]: {
        fontSize: '14px',
        textAlign: 'left',
      },
    }}
    {...restProps}
  >
    {children}
  </Text>
);

export const H2 = ({ children, ...restProps }: TextProps) => (
  <Text
    as="h2"
    fontSize={24}
    fontWeight={700}
    sx={{
      [smMedia]: {
        fontSize: '20px',
      },
    }}
    {...restProps}
  >
    {children}
  </Text>
);

export const H3 = ({ children, ...restProps }: TextProps) => (
  <Text
    as="h3"
    fontSize={16}
    fontWeight={600}
    sx={{
      [smMedia]: {
        fontSize: '14px',
      },
    }}
    {...restProps}
  >
    {children}
  </Text>
);

type JumpLinkProps = LinkProps & {
  id: string;
  openKey: number;
  onOpenKey: (key: number) => void;
};

export const JumpLink = ({ id, children, openKey, onOpenKey, ...restProps }: JumpLinkProps) => {
  return (
    <Link
      display={'inline-block'}
      cursor={'pointer'}
      onClick={() => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        onOpenKey(openKey);
        window.scrollTo({
          top: (rect?.top || 0) + document.documentElement.scrollTop - 65,
          behavior: 'smooth',
        });
      }}
      {...restProps}
    >
      {children}
    </Link>
  );
};
