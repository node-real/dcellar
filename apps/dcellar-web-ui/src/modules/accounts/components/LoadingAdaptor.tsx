import { Loading } from '@totejs/uikit';
import React from 'react'

type Props = {
  loading: boolean;
  empty: boolean;
  children: React.ReactElement;
}
export const LoadingAdaptor = ({ loading, empty, children }: Props) => {
  if (loading) return <Loading color='readable.normal' size={16}/>
  if (empty) return <>--</>;

  return children;
}
