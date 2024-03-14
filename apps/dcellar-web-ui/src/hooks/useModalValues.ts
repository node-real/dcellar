import { isEmpty } from 'lodash-es';
import { useEffect, useState } from 'react';

export function useModalValues<T>(_values: T) {
  const [values, setValues] = useState(_values);

  useEffect(() => {
    if (isEmpty(_values)) return;
    setValues(_values);
  }, [_values]);

  return values;
}
