import { EllipsisText } from '@/components/common/EllipsisText';

type Props = {
  path: string;
  [key: string]: any;
};

export const PathItem = ({ path, ...styleProps }: Props) => {
  return (
    <EllipsisText
      color={'readable.tertiary'}
      maxW="150px"
      textAlign={'center'}
      marginRight={'12px'}
      {...styleProps}
    >
      {path}
    </EllipsisText>
  );
};
