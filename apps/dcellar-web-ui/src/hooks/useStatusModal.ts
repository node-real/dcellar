import { useAppDispatch } from '@/store'
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';

export const BUTTON_GOT_IT = 'Got It';

export function useStatusModal() {
  const dispatch = useAppDispatch();
  const modal = {
    start: ({ title, icon, ...props }: TStatusDetail) => {
      dispatch(
        setStatusDetail({
          title,
          icon,
          ...props,
        }),
      );
    },
    end: () => {
      dispatch(setStatusDetail({} as TStatusDetail))
    },
    error: ({ title, errorText, icon, ...props }: Omit<TStatusDetail, 'icon'> & { icon?: string }) => {
      return dispatch(
        setStatusDetail({
          title,
          icon: icon || 'status-failed',
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + errorText,
          ...props
        }),
      );
    },
  };

  return { modal }
}