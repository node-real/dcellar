import { EllipsisText } from '@/components/common/EllipsisText';
import { contentIconTypeToExtension, formatBytes } from '../file/utils';
import { Box, Flex, Image } from '@totejs/uikit';

type Props = {
  name: string;
  size: number;
  msg?: string;
  maxW: string;
  status: string;
  [key: string]: any;
};
export const NameItem = ({ name, size, msg, maxW, status, ...styleProps }: Props) => {
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
    <Flex maxW={maxW} alignItems="center" {...styleProps}>
      {icon}
      <Box w="calc(100% - 39px)">
        <EllipsisText marginRight={'12px'}>{name}</EllipsisText>
        {['CANCEL', 'ERROR'].includes(status) ? (
          <EllipsisText color={'red'}>{msg}</EllipsisText>
        ) : (
          <EllipsisText color="readable.tertiary">{formatBytes(size)}</EllipsisText>
        )}
      </Box>
    </Flex>
  );
};
