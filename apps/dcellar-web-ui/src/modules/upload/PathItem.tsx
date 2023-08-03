import { EllipsisText } from '@/components/common/EllipsisText';

type Props = {
  path: string;
  [key: string]: any;
};

export const PathItem = ({ path, ...styleProps }: Props) => {
  return (
    <EllipsisText
      color={'readable.tertiary'}
      w={126}
      textAlign={'left'}
      marginRight={'12px'}
      fontWeight={400}
      {...styleProps}
    >
      {path}
    </EllipsisText>
  );
};
