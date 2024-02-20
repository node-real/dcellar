import React, { ReactNode } from 'react';
import { Loading } from '@node-real/uikit';

type Props = {
  loading: boolean;
  empty: boolean;
  emptyText?: ReactNode;
  children: React.ReactElement;
};
export const LoadingAdaptor = ({ loading, empty, children, emptyText = '--' }: Props) => {
  if (loading) return <Loading color="readable.normal" size={16} />;
  if (empty) return <>{emptyText}</>;

  return children;
};
