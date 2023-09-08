import React, { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { setRemoveGroup, setupGroups } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_DELETE_GIF,
  FILE_FAILED_URL,
  GROUP_DELETE,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { toast } from '@totejs/uikit';
import { MsgDeleteGroupTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { trimLongStr } from '@/utils/string';
import { deleteGroup } from '@/facade/group';
import { ConfirmModal } from '@/components/common/DCModal/ConfirmModal';

interface DeleteGroupProps {}

export const DeleteGroup = memo<DeleteGroupProps>(function DeleteGroup() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { removeGroup } = useAppSelector((root) => root.group);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const isOpen = !!removeGroup.groupName;

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Delete Failed',
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };
  const onRemove = async () => {
    const payload = {
      operator: loginAccount,
      groupName: removeGroup.groupName,
    };
    dispatch(setStatusDetail({ icon: FILE_DELETE_GIF, title: GROUP_DELETE, desc: WALLET_CONFIRM }));
    const [txRes, txError] = await deleteGroup(payload, connector!);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group deleted successfully!' });
    dispatch(setupGroups(loginAccount));
  };

  const description = `Are you sure to delete this group ”${trimLongStr(
    removeGroup.groupName,
    16,
    16,
    0,
  )}”? `;
  const fee = gasObjects?.[MsgDeleteGroupTypeUrl]?.gasFee || 0;

  return (
    <ConfirmModal
      confirmText="Delete"
      isOpen={isOpen}
      ga={{
        gaClickCloseName: 'dc.group.delete_confirm.modal.show',
        gaShowName: 'dc.group.delete_confirm.close.click',
        balanceClickName: 'dc.group.delete_confirm.depost.show',
        balanceShowName: 'dc.group.delete_confirm.transferin.click',
        cancelButton: 'dc.group.delete_confirm.cancel.click',
        confirmButton: 'dc.group.delete_confirm.delete.click',
      }}
      title="Confirm Delete"
      fee={fee}
      onConfirm={onRemove}
      onClose={() => {
        dispatch(setRemoveGroup({} as GroupInfo));
      }}
      description={description}
    />
  );
});
