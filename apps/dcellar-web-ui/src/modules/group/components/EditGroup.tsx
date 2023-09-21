import React, { memo, useState } from 'react';
import { DCDrawer } from '@/components/common/DCDrawer';
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
import { setEditGroup, setupGroups } from '@/store/slices/group';
import { useUnmount, useUpdateEffect } from 'ahooks';
import { InputItem } from '@/components/formitems/InputItem';
import { TextareaItem } from '@/components/formitems/TextareaItem';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { Fees } from '@/modules/group/components/Fees';
import { MsgUpdateGroupExtraTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { updateGroupExtra } from '@/facade/group';
import { useAccount } from 'wagmi';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  GROUP_ICON,
  GROUP_UPDATE_EXTRA,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';

interface EditGroupProps {}

export const EditGroup = memo<EditGroupProps>(function CreateGroup() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { editGroup } = useAppSelector((root) => root.group);
  const [error, setError] = useState({ name: '', desc: '' });
  const [form, setForm] = useState({ name: '', desc: '' });
  const [balanceAvailable, setBalanceAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const onClose = () => {
    dispatch(setEditGroup({} as GroupInfo));
  };

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
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const fees = [{ label: 'Gas fee', type: MsgUpdateGroupExtraTypeUrl }];

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
    if (form.desc === editGroup.extra) {
      setLoading(false);
      dispatch(setEditGroup({} as GroupInfo));
      toast.success({ description: 'Group updated successfully!' });
      return;
    }
    dispatch(
      setStatusDetail({ icon: GROUP_ICON, title: GROUP_UPDATE_EXTRA, desc: WALLET_CONFIRM }),
    );
    const [txRes, txError] = await updateGroupExtra(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group updated successfully!' });
    dispatch(setupGroups(loginAccount));
    dispatch(setEditGroup({} as GroupInfo));
  };

  useUnmount(onClose);

  useUpdateEffect(() => {
    if (editGroup.groupName) {
      setForm({ name: editGroup.groupName, desc: editGroup.extra });
      return;
    }
    setError({ name: '', desc: '' });
    setForm({ name: '', desc: '' });
  }, [editGroup.groupName]);

  return (
    <DCDrawer isOpen={!!editGroup.groupName} onClose={onClose}>
      <QDrawerHeader flexDirection="column">Edit Description</QDrawerHeader>
      <QDrawerBody>
        <FormControl mb={16} isInvalid={!!error.name}>
          <FormLabel>
            <Text fontSize={14} fontWeight={500} lineHeight="17px" mb={8}>
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
            <Text fontSize={14} fontWeight={500} lineHeight="17px" mb={8}>
              Description
            </Text>
            <TextareaItem
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
    </DCDrawer>
  );
});
