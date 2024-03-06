import { useAppDispatch } from '@/store';
import { SignatureAction, setSignatureAction } from '@/store/slices/global';

export const BUTTON_GOT_IT = 'Got It';

export function useStatusModal() {
  const dispatch = useAppDispatch();
  const modal = {
    start: ({ title, icon, ...props }: SignatureAction) => {
      dispatch(
        setSignatureAction({
          title,
          icon,
          ...props,
        }),
      );
    },
    end: () => {
      dispatch(setSignatureAction({}));
    },
    error: ({
      title,
      errorText,
      icon,
      ...props
    }: Omit<SignatureAction, 'icon'> & { icon?: string }) => {
      return dispatch(
        setSignatureAction({
          title,
          icon: icon || 'status-failed',
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + errorText,
          ...props,
        }),
      );
    },
  };

  return { modal };
}
