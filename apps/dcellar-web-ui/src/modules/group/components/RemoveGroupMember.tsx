import React, { memo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { setRemoveGroupMember } from '@/store/slices/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  GROUP_ICON,
  GROUP_UPDATE_EXTRA,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/file/constant';
import { useUnmount, useUpdateEffect } from 'ahooks';
import { DCDrawer } from '@/components/common/DCDrawer';
import { Flex, QDrawerBody, QDrawerCloseButton, QDrawerHeader, Text, toast } from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import ComingSoon from '@/components/common/SvgIcon/members.svg';
import { removeMemberFromGroup } from '@/facade/group';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { without } from 'lodash-es';
import { ADDRESS_RE } from '@/utils/regex';

const MAX_COUNT = 20;

interface RemoveGroupMemberProps {}

export const RemoveGroupMember = memo<RemoveGroupMemberProps>(function RemoveGroupMember() {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<string[]>([]);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { removeGroupMember } = useAppSelector((root) => root.group);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const onClose = () => {
    dispatch(setRemoveGroupMember({} as GroupInfo));
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

  const _onChange = (e: string[]) => {
    const values = e.filter((i) => i.match(ADDRESS_RE));
    setValues(values);
    if (values.length > MAX_COUNT) {
      setError(`Please enter less than ${MAX_COUNT} addresses. `);
    } else {
      setError('');
    }
  };

  const _onSelected = (s: string) => {
    const newValues = values.includes(s) ? without(values, s) : [...values, s];
    _onChange(newValues);
  };

  const onRemoveMember = async () => {
    if (!values.length || loading || !!error) return;
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: GROUP_ICON, title: GROUP_UPDATE_EXTRA, desc: WALLET_CONFIRM }),
    );
    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: removeGroupMember.groupName,
      membersToAdd: [],
      membersToDelete: values,
    };
    const [txRes, txError] = await removeMemberFromGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members removed successfully!' });
    onClose();
  };

  useUnmount(onClose);

  useUpdateEffect(() => {
    if (removeGroupMember.groupName) return;
    setError('');
    setValues([]);
  }, [removeGroupMember.groupName]);

  return (
    <DCDrawer isOpen={!!removeGroupMember.groupName} onClose={onClose}>
      <QDrawerCloseButton />
      <QDrawerHeader flexDirection="column">Remove Members</QDrawerHeader>
      <QDrawerBody>
        <Flex gap={12}>
          <DCComboBox
            value={values}
            tokenSeparators={[',']}
            placeholder="Add address, comma separated"
            bordered={false}
            suffixIcon={null}
            mode="tags"
            onChange={_onChange}
            tagRender={(props) => <RenderItem value={props} onSelect={_onSelected} />}
          />
          <DCButton variant="dcPrimary" w={90} h={48} onClick={onRemoveMember}>
            Confirm
          </DCButton>
        </Flex>
        {error && <Text color="#EE3911">{error}</Text>}
        <Flex flexDirection="column" alignItems="center" mt={116}>
          <ComingSoon />
          <Text fontWeight="400" color="#76808F" mt={20}>
            Members list will coming soon.
          </Text>
        </Flex>
      </QDrawerBody>
    </DCDrawer>
  );
});
