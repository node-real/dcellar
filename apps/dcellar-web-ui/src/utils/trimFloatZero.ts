export const trimFloatZero = (str: string) => {
  const [intStr, floatStr] = str.split('.');

  if (floatStr) {
    const trimFloatStr = floatStr.replaceAll(/0+$/g, '');

    return !!trimFloatStr ? `${intStr}.${trimFloatStr}` : intStr;
  }

  return str;
};
