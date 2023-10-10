import { Textarea, TextareaProps } from '@totejs/uikit';
import { memo, useEffect, useRef, useState } from 'react';

interface TextareaItemProps extends TextareaProps {
  onChange: TextareaProps['onChange'];
}

export const TextareaItem = memo<TextareaItemProps>(function InputItem({
  onChange = () => {},
  value = '',
  ...restProps
}) {
  const [input, setInput] = useState(value);
  const compositingRef = useRef(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  return (
    <Textarea
      value={input}
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
  );
});
