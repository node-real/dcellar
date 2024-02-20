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
} from '@node-real/uikit';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectGroupList,
  setEditGroupTagsData,
  setGroupOperation,
  setupGroups,
} from '@/store/slices/group';
import { InputItem } from '@/components/formitems/InputItem';
import { TextareaItem } from '@/components/formitems/TextareaItem';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { Fees } from '@/modules/group/components/Fees';
import { MsgCreateGroupTypeUrl, MsgSetTagTypeUrl, TxResponse } from '@bnb-chain/greenfield-js-sdk';
import { getCreateGroupTx, getUpdateGroupTagsTx } from '@/facade/group';
import { useAccount } from 'wagmi';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Animates } from '@/components/AnimatePng';
import { DEFAULT_TAG, EditTags, getValidTags } from '@/components/common/ManageTags';
import { MsgCreateGroup } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { useUnmount } from 'ahooks';
import { broadcastMulTxs } from '@/facade/common';

interface CreateGroupOperationProps {
  onClose?: () => void;
}

export const CreateGroupOperation = memo<CreateGroupOperationProps>(function CreateGroup({
  onClose = () => {},
}) {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const [error, setError] = useState({ name: '', desc: '' });
  const [form, setForm] = useState({ name: '', desc: '' });
  const [balanceAvailable, setBalanceAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const { editTagsData } = useAppSelector((root) => root.group);
  const validTags = getValidTags(editTagsData);
  const isSetTags = validTags.length > 0;
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
    setLoading(false);
    switch (error) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: 'Create Failed',
            icon: 'status-failed',
            desc: 'Sorry, there’s something wrong when signing with the wallet.',
            buttonText: BUTTON_GOT_IT,
            errorText: 'Error message: ' + error,
          }),
        );
    }
  };

  const fees = [
    {
      label: 'Gas fee',
      types: isSetTags ? [MsgCreateGroupTypeUrl, MsgSetTagTypeUrl] : [MsgCreateGroupTypeUrl],
    },
  ];

  const valid = !(error.name || error.desc);

  const onCreate = async () => {
    const error = validateForm(form);
    if (error.name || error.desc) return;
    setLoading(true);
    const payload: MsgCreateGroup = {
      creator: loginAccount,
      groupName: form.name,
      extra: form.desc,
    };
    dispatch(
      setStatusDetail({ icon: Animates.group, title: 'Creating Group', desc: WALLET_CONFIRM }),
    );

    const txs: TxResponse[] = [];
    const [groupTx, error1] = await getCreateGroupTx(payload);
    if (!groupTx) return errorHandler(error1);

    txs.push(groupTx);

    if (isSetTags) {
      const [tagsTx, error2] = await getUpdateGroupTagsTx({
        address: payload.creator,
        groupName: payload.groupName,
        tags: validTags,
      });
      if (!tagsTx) return errorHandler(error2);

      txs.push(tagsTx);
    }

    const [txRes, error3] = await broadcastMulTxs({
      txs: txs,
      address: payload.creator,
      connector: connector!,
    });
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(error3 || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Group created successfully!' });
    dispatch(setupGroups(loginAccount));
    onClose();
  };

  const onAddTags = () => {
    dispatch(setGroupOperation({level: 1, operation: ['', 'edit_tags']}))
  };

  useUnmount(() => dispatch(setEditGroupTagsData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader flexDirection="column">
        Create a Group
        <Text className="ui-drawer-sub">
          Groups are collections of accounts that share the same permissions.
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <FormControl mb={16} isInvalid={!!error.name}>
          <FormLabel>
            <Text fontSize={14} fontWeight={500} mb={8}>
              Name
            </Text>
            <InputItem
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
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
        <FormControl mb={16}>
          <FormLabel>
            <Text fontWeight={500} mb={8}>
              Tags
            </Text>
            <EditTags onClick={onAddTags} tagsData={editTagsData} />
          </FormLabel>
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
              'Create'
            )}
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </>
  );
});
