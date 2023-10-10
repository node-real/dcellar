import { memo } from 'react';
import styled from '@emotion/styled';
import { assetPrefix } from '@/base/env';

export interface AnimatePngProps {
  type: 'access' | 'group' | 'upload' | 'delete' | 'object';
}

export const Animates = {
  access: 'access',
  group: 'group',
  upload: 'upload',
  delete: 'delete',
  object: 'object',
};

export const AnimatePng = memo<AnimatePngProps>(function AnimatePng({ type }) {
  return <Animate $type={type} />;
});

const Animate = styled.div<{ $type: string }>`
  width: 120px;
  height: 120px;
  background-image: url(${assetPrefix}/images/animate/${(props) => props.$type}.png);
  background-repeat: no-repeat;
  animation: ani steps(3) 1s infinite alternate;
  background-size: 120px 480px;

  @keyframes ani {
    from {
      background-position: 0 0;
    }

    to {
      background-position: 0 -360px;
    }
  }
`;
