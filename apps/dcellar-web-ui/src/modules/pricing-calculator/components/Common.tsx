import { smMedia } from '@/modules/responsive';
import { TextProps, Text } from '@totejs/uikit';

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
