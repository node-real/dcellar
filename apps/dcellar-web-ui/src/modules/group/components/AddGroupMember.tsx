import { memo, useState } from 'react';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { GAContextProvider } from '@/context/GAContext';
import { MsgUpdateGroupMemberTypeUrl, toTimestamp } from '@bnb-chain/greenfield-js-sdk';
import { useAppDispatch, useAppSelector } from '@/store';
import { Flex, Text, toast } from '@node-real/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { DCButton } from '@/components/common/DCButton';
import { Dayjs } from 'dayjs';
import { ADDRESS_RE } from '@/constants/legacy';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { Animates } from '@/components/AnimatePng';
import { UNKNOWN_ERROR, WALLET_CONFIRM } from '@/modules/object/constant';
import { addMemberToGroup } from '@/facade/group';
import { GroupInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { useAccount } from 'wagmi';

const ITEM_LIMIT = 20;

interface AddGroupMemberProps {
  errorHandler: (error: string) => void;
  currentGroup: GroupInfo;
  updateMemberList: (checkId: string, remove?: boolean) => Promise<void>;
}

export const AddGroupMember = memo<AddGroupMemberProps>(function AddGroupMember({
  currentGroup,
  errorHandler,
  updateMemberList,
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const gasObjects = useAppSelector((root) => root.global.gasInfo.gasObjects) || {};

  const [confirmModal, setConfirmModal] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [expiration, setExpiration] = useState<Dayjs>();

  const { connector } = useAccount();

  const fee = gasObjects?.[MsgUpdateGroupMemberTypeUrl]?.gasFee || 0;
  const invalid = !!error || invalidIds.length > 0;

  const onFieldValueChange = (_e: string[]) => {
    const e = _e.map((i) => i.trim());
    setValues(e);
    const invalid = e.filter((i) => !i.match(ADDRESS_RE));
    setInvalidIds(invalid);
    if (e.length > ITEM_LIMIT) {
      setError(`Please enter less than ${ITEM_LIMIT} addresses. `);
    } else if (!e.length) {
      setError(`Please enter addresses. `);
    } else {
      setError('');
    }
  };

  const onAddGroupMember = async () => {
    setLoading(true);
    dispatch(
      setStatusDetail({ icon: Animates.group, title: 'Updating Group', desc: WALLET_CONFIRM }),
    );
    const membersToAdd = values.map((item) => ({
      member: item,
      expirationTime: toTimestamp(expiration!.toDate()),
    }));

    const payload = {
      operator: loginAccount,
      groupOwner: loginAccount,
      groupName: currentGroup.groupName,
      membersToAdd,
      membersToDelete: [],
    };

    const [txRes, txError] = await addMemberToGroup(payload, connector!);
    setLoading(false);
    if (!txRes || txRes.code !== 0) return errorHandler(txError || UNKNOWN_ERROR);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Members added successfully!' });
    updateMemberList(values[0]);
    setValues([]);
  };

  return (
    <>
      <GAContextProvider prefix={'add_member_confirm'}>
        <TxConfirmModal
          confirmText="Confirm"
          isOpen={confirmModal}
          title="Confirm Action"
          fee={fee}
          onConfirm={onAddGroupMember}
          onClose={() => setConfirmModal(false)}
          description="Are you sure you want to add members to this group?"
        />
      </GAContextProvider>
      <Flex gap={12}>
        <DCComboBox
          dateChange={setExpiration}
          value={values}
          tokenSeparators={[',']}
          placeholder="Add address, comma separated"
          bordered={false}
          mode="tags"
          onChange={onFieldValueChange}
          tagRender={(props) => <RenderItem invalidIds={invalidIds} value={props} />}
          suffixIcon={
            <Text color="#1E2026" fontSize={14}>
              Member
            </Text>
          }
        />
        <DCButton
          size={'lg'}
          w={90}
          onClick={() => {
            onFieldValueChange(values);
            if (!values.length || loading || invalid) return;
            setConfirmModal(true);
          }}
        >
          Add
        </DCButton>
      </Flex>
      {invalid && <Text color="#EE3911">{!invalidIds.length ? error : 'Invalid addresses.'}</Text>}
    </>
  );
});
