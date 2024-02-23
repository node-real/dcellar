import { ObjectsPage } from '@/modules/object';
import { css, Global } from '@emotion/react';

export default function Objects() {
  return (
    <>
      <ObjectsPage />
      <Global
        styles={css`
          #layout-main {
            min-width: 949px;
          }
        `}
      />
    </>
  );
}
