export const signTypedDataV4 = async (provider: any, addr: string, message: string) => {
  return await provider?.request({
    method: 'eth_signTypedData_v4',
    params: [addr, message],
  });
}