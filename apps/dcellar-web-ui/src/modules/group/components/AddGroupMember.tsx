import React, { memo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { setAddGroupMember } from '@/store/slices/group';
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
import { Flex, QDrawerBody, QDrawerHeader, Text, toast } from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import ComingSoon from '@/components/common/SvgIcon/members.svg';
import { addMemberToGroup } from '@/facade/group';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { ADDRESS_RE } from '@/utils/regex';
import { getUtcZeroTimestamp, toTimestamp } from '@bnb-chain/greenfield-js-sdk';

const MAX_COUNT = 20;

interface AddMemberProps {}

export const AddGroupMember = memo<AddMemberProps>(function AddMember() {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<string[]>([]);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { addGroupMember } = useAppSelector((root) => root.group);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const [invalidIds, setInvalidIds] = useState<string[]>([]);

  const onClose = () => {
    dispatch(setAddGroupMember({} as GroupInfo));
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
    setValues(e);
    const invalid = e.filter((i) => !i.match(ADDRESS_RE));
    setInvalidIds(invalid);
    if (e.length > MAX_COUNT) {
      setError(`Please enter less than ${MAX_COUNT} addresses. `);
    } else {
      setError('');
    }
  };

  const invalid = !!error || invalidIds.length > 0;

  const onAddMember = async () => {
    if (!values.length || loading || invalid) return;
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: GROUP_ICON, title: GROUP_UPDATE_EXTRA, desc: WALLET_CONFIRM }),
    );
    // TODO
    const curTimeStamp = await getUtcZeroTimestamp();
    const expirationTimestamp = Math.floor(curTimeStamp + 10 * 60 * 60 * 1000);
    const expirationDate = new Date(expirationTimestamp);
    const membersToAdd = values.map(item => ({
      member: item,
      expirationTime: toTimestamp(expirationDate),
    }))

    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: addGroupMember.groupName,
      membersToAdd,
      membersToDelete: [],
    };

    const [txRes, txError] = await addMemberToGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members added successfully!' });
    onClose();
  };

  useUnmount(onClose);

  useUpdateEffect(() => {
    if (addGroupMember.groupName) return;
    setError('');
    setValues([]);
    setInvalidIds([]);
  }, [addGroupMember.groupName]);

  return (
    <DCDrawer isOpen={!!addGroupMember.groupName} onClose={onClose}>
      <QDrawerHeader flexDirection="column">Add Members</QDrawerHeader>
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
            tagRender={(props) => <RenderItem invalidIds={invalidIds} value={props} />}
          />
          <DCButton variant="dcPrimary" w={90} h={48} onClick={onAddMember}>
            Add
          </DCButton>
        </Flex>
        {invalid && (
          <Text color="#EE3911">{!invalidIds.length ? error : 'Invalid addresses.'}</Text>
        )}
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
