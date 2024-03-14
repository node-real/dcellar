import { Animates } from '@/components/AnimatePng';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { deleteGroup } from '@/facade/group';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setGroupRemoving, setupGroupList } from '@/store/slices/group';
import { trimLongStr } from '@/utils/string';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { MsgDeleteGroupTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { toast } from '@node-real/uikit';
import { memo } from 'react';
import { useAccount } from 'wagmi';
import { GAContextProvider } from '@/context/GAContext';
import { selectGnfdGasFeesConfig, setSignatureAction } from '@/store/slices/global';

interface DeleteGroupProps {}

export const DeleteGroupOperation = memo<DeleteGroupProps>(function DeleteGroup() {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const groupRemoving = useAppSelector((root) => root.group.groupRemoving);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);

  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const isOpen = !!groupRemoving.groupName;
  const description = `Are you sure to delete this group ”${trimLongStr(
    groupRemoving.groupName,
    16,
    16,
    0,
  )}”? `;
  const fee = gnfdGasFeesConfig?.[MsgDeleteGroupTypeUrl]?.gasFee || 0;

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setSignatureAction({
            title: 'Delete Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
          }),
        );
    }
  };

  const onDeleteGroup = async () => {
    const payload = {
      operator: loginAccount,
      groupName: groupRemoving.groupName,
    };
    dispatch(
      setSignatureAction({ icon: Animates.group, title: 'Deleting Group', desc: WALLET_CONFIRM }),
    );
    const [txRes, txError] = await deleteGroup(payload, connector!);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Group deleted successfully!' });
    dispatch(setupGroupList(loginAccount));
  };

  return (
    <GAContextProvider prefix={'delete_confirm'}>
      <TxConfirmModal
        isOpen={isOpen}
        confirmText="Delete"
        title="Confirm Delete"
        description={description}
        fee={fee}
        variant={'scene'}
        onConfirm={onDeleteGroup}
        onClose={() => {
          dispatch(setGroupRemoving({} as GroupInfo));
        }}
      />
    </GAContextProvider>
  );
});
