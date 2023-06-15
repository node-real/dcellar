const slashSeparator = "/";
const dotdotComponent = "..";
const dotComponent = ".";

const hasBadPathComponent = (path: string): boolean => {
  const newPath = path.trim();
  for (const p of newPath.split(slashSeparator)) {
    switch (p.trim()) {
      case dotdotComponent:
      case dotComponent:
        return true;
    }
  }
  return false;
}

const isUTF8 = (str: string): boolean => {
  try {
    new TextDecoder('utf-8').decode(new TextEncoder().encode(str));
    return true;
  } catch {
    return false;
  }
}

export const validateObjectName = (objectName?: string) => {
  if (!objectName) {
    throw new Error('Object name is empty, please check.');
  }
  if (objectName.length > 1024) {
    throw new Error('Object name is limited to 1024 at most, please check.');
  }
  if (hasBadPathComponent(objectName)) {
    throw new Error('Object name error, please check.')
  }
  if (!isUTF8(objectName)) {
    throw new Error('Object name is not in UTF-8 format, please check.')
  }
  if (objectName.includes(`//`)) {
    throw new Error(`Object name that contains a "//" is not supported`)
  }
};
