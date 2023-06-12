import Script from 'next/script';
import React from 'react';

interface IGtag {
  id: string;
  disabled?: boolean;
}

export const Ga4 = ({ id, disabled }: IGtag) => {
  if (disabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
};
