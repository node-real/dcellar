import React, { memo, useState } from 'react';
import {
  Flex,
  FormControl,
  FormLabel,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupGroups } from '@/store/slices/group';
import { InputItem } from '@/components/formitems/InputItem';
import { TextareaItem } from '@/components/formitems/TextareaItem';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { Fees } from '@/modules/group/components/Fees';
import { MsgUpdateGroupExtraTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { updateGroupExtra } from '@/facade/group';
import { useAccount } from 'wagmi';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useMount } from 'ahooks';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Animates } from '@/components/AnimatePng';

interface EditGroupOperationProps {
  selectGroup: GroupInfo;
  onClose?: () => void;
}

export const EditGroupOperation = memo<EditGroupOperationProps>(function CreateGroup({
  selectGroup,
  onClose = () => {},
}) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const [error, setError] = useState({ name: '', desc: '' });
  const [form, setForm] = useState({ name: '', desc: '' });
  const [balanceAvailable, setBalanceAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const validateForm = (values: Record<'name' | 'desc', string>) => {
    const { desc } = values;
    const _error = { ...error };
    if (new Blob([desc]).size >= 500) {
      _error.desc = 'Please enter less than 500 characters.';
    } else {
      _error.desc = '';
    }
    setError(_error);
    return _error;
  };

  const onFormChange = (value: string, key: string) => {
    const newValues = { ...form, [key]: value };
    validateForm(newValues);
    setForm(newValues);
  };

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Update Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
          }),
        );
    }
  };

  const fees = [{ label: 'Gas fee', type: [MsgUpdateGroupExtraTypeUrl] }];

  const valid = !(error.name || error.desc);

  const onCreate = async () => {
    const error = validateForm(form);
    if (error.name || error.desc) return;
    setLoading(true);
    const payload = {
      operator: loginAccount,
      groupName: form.name,
      groupOwner: loginAccount,
      extra: form.desc,
    };
    if (form.desc === selectGroup.extra) {
      setLoading(false);
      onClose();
      toast.success({ description: 'Group updated successfully!' });
      return;
    }
    dispatch(
      setStatusDetail({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const [txRes, txError] = await updateGroupExtra(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group updated successfully!' });
    dispatch(setupGroups(loginAccount));
    onClose();
  };

  useMount(() => {
    setForm({ name: selectGroup.groupName, desc: selectGroup.extra });
  });

  return (
    <>
      <QDrawerHeader>Edit Description</QDrawerHeader>
      <QDrawerBody>
        <FormControl mb={16} isInvalid={!!error.name}>
          <FormLabel>
            <Text fontSize={14} fontWeight={500} mb={8}>
              Name
            </Text>
            <InputItem
              disabled
              value={form.name}
              placeholder="Enter a group name"
              onChange={(e) => onFormChange(e.target.value, 'name')}
            />
          </FormLabel>
          <ErrorDisplay errorMsgs={[error.name]} />
        </FormControl>
        <FormControl mb={16} isInvalid={!!error.desc}>
          <FormLabel>
            <Text fontSize={14} fontWeight={500} mb={8}>
              Description
            </Text>
            <TextareaItem
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
              value={form.desc}
              h={100}
              resize="none"
              placeholder="Enter description for your group. (Optional)"
              onChange={(e) => onFormChange(e.target.value, 'desc')}
            />
          </FormLabel>
          <ErrorDisplay errorMsgs={[error.desc]} />
        </FormControl>
      </QDrawerBody>
      <QDrawerFooter
        flexDirection={'column'}
        marginTop={'12px'}
        borderTop={'1px solid readable.border'}
        gap={'8px'}
      >
        <Fees fees={fees} setBalanceAvailable={setBalanceAvailable} />
        <Flex width={'100%'} flexDirection={'column'}>
          <DCButton
            size={'lg'}
            w="100%"
            justifyContent={'center'}
            gaClickName="dc.file.upload_modal.confirm.click"
            disabled={!balanceAvailable || !valid || loading}
            onClick={onCreate}
          >
            {loading ? (
              <>
                Loading
                <DotLoading />
              </>
            ) : (
              'Update'
            )}
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </>
  );
});
