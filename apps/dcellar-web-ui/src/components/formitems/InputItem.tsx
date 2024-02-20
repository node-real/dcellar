import { Box, Input, InputGroup, InputProps, InputRightElement, Text } from '@node-real/uikit';
import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { Tips } from '@/components/common/Tips';

interface InputItemProps extends InputProps {
  tips?: { title: string; rules: string[] };
  onChange: InputProps['onChange'];
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

export const InputItem = memo<InputItemProps>(function InputItem({
  tips,
  onChange = () => {},
  value = '',
  leftElement,
  rightElement,
  ...restProps
}) {
  const [input, setInput] = useState(value);
  const compositingRef = useRef(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  return (
    <InputGroup>
      {leftElement}
      <Input
        value={input}
        autoFocus
        autoComplete="off"
        type="text"
        border="1px solid #EAECF0"
        placeholder="Enter a folder name"
        fontSize={16}
        lineHeight="19px"
        fontWeight={500}
        height={52}
        onChange={(e) => {
          setInput(e.target.value);
          if (compositingRef.current) return;
          onChange(e);
        }}
        onCompositionStart={() => (compositingRef.current = true)}
        onCompositionEnd={(e) => {
          compositingRef.current = false;
          onChange(e as any);
        }}
        onCompositionUpdate={() => (compositingRef.current = true)}
        {...restProps}
      />
      {rightElement}
      {tips && (
        <InputRightElement marginRight={8}>
          <Tips
            iconSize={24}
            containerWidth={308}
            trigger="hover"
            tips={
              <Box w={308} paddingRight={8}>
                <Text color="readable.normal" fontSize={14} fontWeight={600} mb={4}>
                  {tips.title}
                </Text>
                <Box
                  as="ul"
                  color="readable.secondary"
                  fontSize={14}
                  lineHeight={1.5}
                  listStyleType="disc"
                  listStylePosition="outside"
                  ml={20}
                  wordBreak="break-word"
                >
                  {tips.rules.map((rule, key) => (
                    <Box key={key} as="li" mb={4}>
                      {rule}
                    </Box>
                  ))}
                </Box>
              </Box>
            }
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
});
