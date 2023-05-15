export const parseError = (errorMessage: string) => {
  const regex = /\((\d+)\):\s+([^:]+):/;

  const match = errorMessage.match(regex);

  return {
    isError: !match ? true : false,
    code: (match && match[1]) || -1,
    message: (match && match[2]) || '',
  };
};
