import { toast } from '@totejs/uikit';

export function handleCommonError(err: any, msgMap: Record<string, string>, defaultMsg: string) {
  const code = err.cause?.code ?? err.code;
  const message = err.cause?.message ?? err.message;
  const text = message || msgMap[code];

  toast.error({
    description: text || defaultMsg,
  });
}
