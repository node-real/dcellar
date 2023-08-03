import { EllipsisText } from '@/components/common/EllipsisText';
import { contentIconTypeToExtension, formatBytes } from '../file/utils';
import { Box, Flex, Image } from '@totejs/uikit';

type Props = {
  name: string;
  size: number;
  msg?: string;
  status?: string;
  [key: string]: any;
};
export const NameItem = ({ name, size, msg,  status, ...styleProps }: Props) => {
  const fileType = contentIconTypeToExtension(name);
  const icon = (
    <Flex
      width={27}
      height={27}
      border={'1px solid readable.border'}
      borderRadius={4}
      alignItems={'center'}
      justifyContent={'center'}
      marginRight={12}
    >
      <Image
        src={`/images/files/icons/${fileType.toLocaleLowerCase()}.svg`}
        alt={fileType}
        width={20}
        height={20}
      />
    </Flex>
  );
  return (
    <Flex alignItems="center" {...styleProps}>
      {icon}
      <Box w="calc(100% - 39px)">
        <EllipsisText marginRight={'12px'}>{name}</EllipsisText>
        {status && ['CANCEL', 'ERROR'].includes(status) || msg ? (
          <EllipsisText fontWeight={400} color={'red'}>{msg}</EllipsisText>
        ) : (
          <EllipsisText fontWeight={400} color="readable.tertiary">{formatBytes(size)}</EllipsisText>
        )}
      </Box>
    </Flex>
  );
};
