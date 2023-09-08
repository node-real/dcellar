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
import { selectGroupList, setCreatingGroup, setupGroups } from '@/store/slices/group';
import { useUnmount, useUpdateEffect } from 'ahooks';
import { InputItem } from '@/components/formitems/InputItem';
import { TextareaItem } from '@/components/formitems/TextareaItem';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { Fees } from '@/modules/group/components/Fees';
import { MsgCreateGroupTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { createGroup } from '@/facade/group';
import { useAccount } from 'wagmi';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  GROUP_CREATE,
  GROUP_ICON,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

interface CreateGroupProps {}

export const CreateGroup = memo<CreateGroupProps>(function CreateGroup() {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { creatingGroup } = useAppSelector((root) => root.group);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const [error, setError] = useState({ name: '', desc: '' });
  const [form, setForm] = useState({ name: '', desc: '' });
  const [balanceAvailable, setBalanceAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const onClose = () => {
    dispatch(setCreatingGroup(false));
  };

  const validateForm = (values: Record<'name' | 'desc', string>) => {
    const { name, desc } = values;
    const _error = { ...error };
    const nlen = new Blob([name]).size;
    if (!nlen) {
      _error.name = 'Please enter the group name.';
    } else if (nlen < 3 || nlen > 63) {
      _error.name = 'Must be between 3 to 63 characters long.';
    } else if (groupList?.some((i) => i.groupName === name)) {
      _error.name = 'This name is already taken by you, try another one.';
    } else {
      _error.name = '';
    }
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
            title: 'Create Failed',
            icon: FILE_FAILED_URL,
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
          }),
        );
    }
  };

  const fees = [{ label: 'Gas fee', type: MsgCreateGroupTypeUrl }];

  const valid = !(error.name || error.desc);

  const onCreate = async () => {
    const error = validateForm(form);
    if (error.name || error.desc) return;
    setLoading(true);
    const payload = {
      creator: loginAccount,
      groupName: form.name,
      extra: form.desc,
      members: [loginAccount],
    };
    dispatch(setStatusDetail({ icon: GROUP_ICON, title: GROUP_CREATE, desc: WALLET_CONFIRM }));
    const [txRes, txError] = await createGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group created successfully!' });
    dispatch(setupGroups(loginAccount));
    dispatch(setCreatingGroup(false));
  };

  useUnmount(() => {
    dispatch(setCreatingGroup(false));
  });

  useUpdateEffect(() => {
    if (creatingGroup) return;
    setError({ name: '', desc: '' });
    setForm({ name: '', desc: '' });
  }, [creatingGroup]);

  return (
    <DCDrawer isOpen={creatingGroup} onClose={onClose}>
      <QDrawerHeader flexDirection="column">
        Create a Group
        <Text fontSize={14} lineHeight="17px" fontWeight={400} color="#76808F">
          Groups are collections of accounts that share the same permissions.
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <FormControl mb={16} isInvalid={!!error.name}>
          <FormLabel>
            <Text fontSize={14} fontWeight={500} lineHeight="17px" mb={8}>
              Name
            </Text>
            <InputItem
              value={form.name}
              placeholder="Enter a group name"
              onChange={(e) => onFormChange(e.target.value, 'name')}
              tips={{
                title: 'Naming Rules',
                rules: [
                  'The group name cannot be duplicated under the same user.',
                  'Must be between 1 and 63 characters long.',
                ],
              }}
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
            variant={'dcPrimary'}
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
              'Create'
            )}
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
});
