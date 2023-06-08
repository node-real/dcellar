import React, { useContext } from 'react';

import { LoginLayout } from '@/components/layout/LoginLayout';
import { StatusCodeContext } from '@/context/GlobalContext/StatusCodeContext';
import ErrorComponent from '@/components/ErrorComponent';

const Layout = ({ children }: React.PropsWithChildren) => {
  const statusCode = useContext(StatusCodeContext);

  if (statusCode === 200) {
    return <LoginLayout>{children}</LoginLayout>;
  }

  return <ErrorComponent statusCode={statusCode} />;
};

export default Layout;
