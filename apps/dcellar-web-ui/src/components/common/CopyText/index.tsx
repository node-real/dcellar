import { GAClick } from '@/components/common/GATracker';
import { ColoredSuccessIcon, CopyIcon } from '@totejs/icons';
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

export interface CopyTextProps extends FlexProps {
  value: string;
  iconProps?: Omit<IconButtonProps, 'icon'>;

  gaClickName?: string;
  gaClickData?: Record<string, any>;
}
export function CopyText(props: CopyTextProps) {
  const { value, children, iconProps, gaClickName, gaClickData, ...restProps } = props;
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
    >
      <Box>{children}</Box>

      <Tooltip
        content={
          hasCopied ? (
            <Center color={'readable.normal'}>
              <ColoredSuccessIcon color={'readable.primary'} size="sm" mr={4} />
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
            color="readable.primary"
            icon={<CopyIcon size="md" />}
            onClick={onCopy}
            _hover={{
              color: 'readable.brand6',
            }}
            {...iconProps}
          />
        </GAClick>
      </Tooltip>
    </Flex>
  );
}
