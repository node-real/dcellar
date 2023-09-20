import { memo } from 'react';
import { IconFont } from '@/components/IconFont';

export interface AvatarProps {
  id: string;
  w: number;
  h?: number;
}

export const Avatar = memo<AvatarProps>(function Avatar({ id, w, h = w }) {
  if (!id) return null;
  const isAddress = id.startsWith('0x');
  const lastCharCode = id[id.length - 1].charCodeAt(0);
  const index = lastCharCode % 5;
  return <IconFont type={`${isAddress ? 'a' : 'g'}-${index}`} w={w} h={h} />;
});
