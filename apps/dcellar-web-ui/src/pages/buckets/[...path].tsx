import { ObjectsPage } from '@/modules/object';
import React from 'react';
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
