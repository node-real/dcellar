import { IconFont } from '@/components/IconFont';
import styled from '@emotion/styled';
import { Button, useClipboard } from '@node-real/uikit';
import { PropsWithChildren, memo, useEffect } from 'react';

interface CopyButtonProps extends PropsWithChildren {
  text: string;
}

export const CopyButton = memo<CopyButtonProps>(function CopyButton({ text, children }) {
  const { hasCopied, onCopy, setValue } = useClipboard(text);

  useEffect(() => {
    setValue(text);
  }, [setValue, text]);

  return (
    <Copy
      iconSpacing={4}
      leftIcon={<IconFont type={hasCopied ? 'tick' : 'link'} w={16} />}
      onClick={onCopy}
    >
      {children}
    </Copy>
  );
});

const Copy = styled(Button)`
  padding: 8px 24px;
  border-radius: 360px;
  border: 1px solid #00ba34;
  background: #fff;
  color: #00ba34;
  text-align: center;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  height: 38px;
  :hover {
    color: #fff;
    background: #00ba34;
  }
`;
