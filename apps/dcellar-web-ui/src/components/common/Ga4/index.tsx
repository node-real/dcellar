import React from 'react';

interface IGtag {
  id: string;
  disabled?: boolean;
}

export const Ga4 = ({ id, disabled }: IGtag) => {
  if (disabled) return null;

  return (
    <>
      <script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} async />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${id}');
        `,
        }}
      />
    </>
  );
};
