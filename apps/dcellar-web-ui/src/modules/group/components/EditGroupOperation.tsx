import { Animates } from '@/components/AnimatePng';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { InputItem } from '@/components/formitems/InputItem';
import { TextareaItem } from '@/components/formitems/TextareaItem';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { updateGroupExtra } from '@/facade/group';
import { Fees } from '@/modules/group/components/Fees';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSignatureAction } from '@/store/slices/global';
import { setupGroupList } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { MsgUpdateGroupExtraTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import {
  Flex,
  FormControl,
  FormLabel,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@node-real/uikit';
import { useMount } from 'ahooks';
import { memo, useState } from 'react';
import { useAccount } from 'wagmi';

interface EditGroupOperationProps {
  selectGroup: GroupInfo;
  onClose?: () => void;
}

export const EditGroupOperation = memo<EditGroupOperationProps>(function CreateGroup({
  selectGroup,
  onClose = () => {},
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  const [error, setError] = useState({ name: '', desc: '' });
  const [form, setForm] = useState({ name: '', desc: '' });
  const [balanceAvailable, setBalanceAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const fees = [{ label: 'Gas fee', types: [MsgUpdateGroupExtraTypeUrl] }];
  const valid = !(error.name || error.desc);

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

  const errorHandler = (error: string) => {
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setSignatureAction({
            title: 'Update Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
          }),
        );
    }
  };

  const onFormValueChange = (value: string, key: string) => {
    const newValues = { ...form, [key]: value };
    validateForm(newValues);
    setForm(newValues);
  };

  const onUpdateGroup = async () => {
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
      setSignatureAction({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const [txRes, txError] = await updateGroupExtra(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Group updated successfully!' });
    dispatch(setupGroupList(loginAccount));
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
              onChange={(e) => onFormValueChange(e.target.value, 'name')}
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
              onKeyDown={(e) => e.key === 'Enter' && onUpdateGroup()}
              value={form.desc}
              h={100}
              resize="none"
              placeholder="Enter description for your group. (Optional)"
              onChange={(e) => onFormValueChange(e.target.value, 'desc')}
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
            onClick={onUpdateGroup}
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
