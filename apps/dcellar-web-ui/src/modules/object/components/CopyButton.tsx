import { memo, PropsWithChildren, useEffect } from 'react';
import { Button, useClipboard } from '@totejs/uikit';
import LinkIcon from '@/components/common/SvgIcon/LinkIcon.svg';
import TickIcon from '@/components/common/SvgIcon/TickIcon.svg';
import styled from '@emotion/styled';

interface CopyButtonProps extends PropsWithChildren {
  text: string;
}

export const CopyButton = memo<CopyButtonProps>(function CopyButton({ text, children }) {
  const { hasCopied, onCopy, setValue } = useClipboard(text);

  useEffect(() => {
    setValue(text);
  }, [setValue, text]);

  return (
    <Copy iconSpacing={4} leftIcon={hasCopied ? <TickIcon /> : <LinkIcon />} onClick={onCopy}>
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
