import React, { useContext } from 'react';

import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import ErrorComponent from '@/components/ErrorComponent';
import { Page } from '@/components/layout/Page';

const Layout = ({ children }: React.PropsWithChildren) => {
  const statusCode = useContext(StatusCodeContext);

  if (statusCode === 200) {
    return <Page>{children}</Page>;
  }

  return <ErrorComponent statusCode={statusCode} />;
};

export default Layout;
