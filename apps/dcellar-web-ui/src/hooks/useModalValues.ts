import { useEffect, useState } from 'react';
import { isEmpty } from 'lodash-es';

export function useModalValues<T>(_values: T) {
  const [values, setValues] = useState(_values);

  useEffect(() => {
    if (isEmpty(_values)) return;
    setValues(_values);
  }, [_values]);

  return values;
}
