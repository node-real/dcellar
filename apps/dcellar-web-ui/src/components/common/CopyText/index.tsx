import { GAClick } from '@/components/common/GATracker';
import {
  Flex,
  Box,
  FlexProps,
  IconButton,
  Tooltip,
  useClipboard,
  Center,
  Text,
  IconButtonProps,
} from '@totejs/uikit';
import { useEffect } from 'react';
import { IconFont } from '@/components/IconFont';

export interface CopyTextProps extends FlexProps {
  value: string;
  iconProps?: Omit<IconButtonProps, 'icon'>;
  boxSize?: number;

  gaClickName?: string;
  gaClickData?: Record<string, any>;
}
export function CopyText(props: CopyTextProps) {
  const {
    value,
    children,
    iconProps,
    gaClickName,
    gaClickData,
    boxSize = 20,
    ...restProps
  } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(value);

  useEffect(() => {
    setValue(value);
  }, [setValue, value]);

  return (
    <Flex
      wordBreak="break-all"
      gap={4}
      fontSize={14}
      lineHeight="20px"
      fontWeight={500}
      {...restProps}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Box>{children}</Box>
      <Tooltip
        content={
          hasCopied ? (
            <Center color={'readable.normal'}>
              <IconFont type="colored-success" w={16} mr={4} />
              Copied
            </Center>
          ) : (
            <Text color={'readable.normal'}>Copy</Text>
          )
        }
      >
        <GAClick name={gaClickName} data={gaClickData}>
          <IconButton
            alignSelf="flex-start"
            size="sm"
            variant="link"
            color={'readable.normal'}
            icon={<IconFont type="copy" w={boxSize} />}
            onClick={onCopy}
            _hover={{
              color: hasCopied ? 'brand.brand6' : 'brand.brand5',
            }}
            {...iconProps}
          />
        </GAClick>
      </Tooltip>
    </Flex>
  );
}
