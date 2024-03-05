import {
  Principal,
  PrincipalType,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/permission/common';
import {
  GRNToString,
  MsgDeletePolicyTypeUrl,
  MsgPutPolicyTypeUrl,
  PermissionTypes,
  newBucketGRN,
  newObjectGRN,
  toTimestamp,
} from '@bnb-chain/greenfield-js-sdk';
import { ObjectMeta, PolicyMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import styled from '@emotion/styled';
import { Box, Divider, Flex, Grid, MenuButton, Text, toast } from '@node-real/uikit';
import { useAsyncEffect, useMount, useUnmount } from 'ahooks';
import cn from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { escapeRegExp, uniq, without, xor } from 'lodash-es';
import { memo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { Animates } from '@/components/AnimatePng';
import { Avatar } from '@/components/Avatar';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { DCComboBox } from '@/components/common/DCComboBox';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { SimplePagination } from '@/components/common/DCTable/SimplePagination';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { Loading } from '@/components/common/Loading';
import { ADDRESS_RE, GROUP_ID } from '@/constants/legacy';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { deleteObjectPolicy, putBucketPolicies, putObjectPolicies } from '@/facade/object';
import { BUTTON_GOT_IT, FILE_ACCESS, WALLET_CONFIRM } from '@/modules/object/constant';
import { ActionTypeValue } from '@/modules/object/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectGroupList, setGroupMemberListPage, setupGroupList } from '@/store/slices/group';
import {
  ObjectResource,
  TStatusDetail,
  setObjectPolicyListPage,
  setObjectShareSelectedMembers,
  setStatusDetail,
  setupObjectPolicies,
} from '@/store/slices/object';
import { trimAddress } from '@/utils/string';
import { GAContextProvider } from '@/context/GAContext';

const MAX_COUNT = 20;
const MEMBER_SIZE = 20;
const MAX_GROUP = 10;

const menus: MenuOption[] = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Remove', value: 'remove', variant: 'danger' },
];

interface ViewerListProps {
  selectObjectInfo: ObjectMeta;
}

export const ViewerList = memo<ViewerListProps>(function ViewerList({ selectObjectInfo }) {
  const dispatch = useAppDispatch();
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectPolicyListRecords = useAppSelector((root) => root.object.objectPolicyListRecords);
  const objectPolicyListPage = useAppSelector((root) => root.object.objectPolicyListPage);
  const objectShareSelectedMembers = useAppSelector(
    (root) => root.object.objectShareSelectedMembers,
  );
  const objectPolicyResourcesRecords = useAppSelector(
    (root) => root.object.objectPolicyResourcesRecords,
  );
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const gasObjects = useAppSelector((root) => root.global.gasInfo.gasObjects) || {};

  const [values, setValues] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [removeAccount, setRemoveAccount] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [expiration, setExpiration] = useState<Dayjs>();
  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();

  const objectInfo = selectObjectInfo.ObjectInfo;
  // share bucket
  const bucketName = objectInfo.BucketName || currentBucketName;
  const path = [bucketName, objectInfo.ObjectName].join('/');
  const memberList = (objectPolicyListRecords[path] || []) as Array<
    PolicyMeta & Partial<ObjectResource>
  >;
  const memberListLoading = !(path in objectPolicyListRecords);
  const isFolder = objectInfo.ObjectName.endsWith('/') || objectInfo.ObjectName === '';

  const { page, canPrev, canNext } = useTableNav<PolicyMeta>({
    list: memberList,
    sorter: ['CreateTimestamp', 'descend'],
    pageSize: MEMBER_SIZE,
    currentPage: objectPolicyListPage,
  });

  const groups = uniq(
    values.concat(memberList.map((l) => l.PrincipalValue)).filter((v) => v.match(GROUP_ID)),
  );

  const invalid = !!error || !!invalidIds.length || groups.length > MAX_GROUP;

  const options = groupList.map((g) => ({ label: g.groupName, value: g.id, desc: g.extra }));

  const _options = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const putFee = (gasObjects?.[MsgPutPolicyTypeUrl]?.gasFee || 0) * values.length;
  const deleteFee = (gasObjects?.[MsgDeletePolicyTypeUrl]?.gasFee || 0) * removeAccount.length;

  const indeterminate = page.some((i) => objectShareSelectedMembers.includes(i.PrincipalValue));
  const accounts = without(
    page.map((i) => i.PrincipalValue),
    loginAccount,
  );
  const allChecked =
    accounts.every((i) => objectShareSelectedMembers.includes(i)) && !!accounts.length;

  const members = objectShareSelectedMembers.length;

  const _onChange = (_e: string[]) => {
    const e = _e.map((i) => i.trim());
    setValues(e);
    setInvalidIds((ids) => ids.filter((id) => e.includes(id)));
    setSearchValue('');
    if (e.length > MAX_COUNT) {
      setError(`Please enter less than ${MAX_COUNT} addresses or group IDs. `);
    } else if (!e.length) {
      setError(`Please enter addresses or group IDs. `);
    } else {
      setError('');
    }
  };

  const _onSelected = (s: string) => {
    const newValues = values.includes(s) ? without(values, s) : [...values, s];
    _onChange(newValues);
  };

  const onPageChange = (pageSize: number, next: boolean, prev: boolean) => {
    if (prev || next) {
      return dispatch(setObjectPolicyListPage(objectPolicyListPage + (next ? 1 : -1)));
    }
    dispatch(setObjectPolicyListPage(0));
  };

  const errorHandler = (type: string) => {
    switch (type) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: FILE_ACCESS,
            icon: 'status-failed',
            buttonText: BUTTON_GOT_IT,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
            errorText: 'Error message: ' + type,
          }),
        );
        return;
    }
  };

  const updateMemberList = async (checkId: string, remove = false) => {
    dispatch(setGroupMemberListPage(0));
    const fetch = () => {
      return dispatch(setupObjectPolicies(bucketName, objectInfo.ObjectName));
    };
    const members = await fetch();

    const needReFetch = remove
      ? members.some((m) => m.PrincipalValue === checkId)
      : members.every((m) => m.PrincipalValue !== checkId);

    if (!needReFetch) return;
    setTimeout(fetch, 1000);
  };

  const onAddMember = async (_removed?: string[]) => {
    if ((!values.length || loading || invalid) && !_removed) return;

    const deleteBucketPolicy: Array<{
      p: Principal;
      r: string;
    }> = [];

    const payloads = (
      _removed
        ? _removed
        : values.filter(
            (v) => !memberList.some((m) => m.PrincipalValue.toLowerCase() === v.toLowerCase()),
          )
    ).map((value) => {
      const key = isFolder
        ? `${bucketName}-${value}`.toLowerCase()
        : `${bucketName}/${objectInfo.ObjectName}-${value}`.toLowerCase();

      const resource = objectPolicyResourcesRecords[key] || { Resources: [], Actions: [] };

      if (key in objectPolicyResourcesRecords && isFolder) {
        deleteBucketPolicy.push({
          p: {
            type: value.match(GROUP_ID)
              ? PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP
              : PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
            value,
          },
          r: GRNToString(newBucketGRN(bucketName)),
        });
      }

      return {
        operator: loginAccount,
        // allow, get
        statements: [
          {
            effect: PermissionTypes.Effect.EFFECT_ALLOW,
            actions: uniq([
              ...resource.Actions.map((r) => ActionTypeValue[r]),
              PermissionTypes.ActionType.ACTION_GET_OBJECT,
            ]),
            // todo may empty resources
            resources: isFolder
              ? _removed
                ? xor(resource.Resources, [
                    GRNToString(
                      newObjectGRN(
                        bucketName,
                        !objectInfo.ObjectName ? '*' : escapeRegExp(objectInfo.ObjectName),
                      ),
                    ),
                  ])
                : uniq([
                    ...resource.Resources,
                    GRNToString(
                      newObjectGRN(
                        bucketName,
                        !objectInfo.ObjectName ? '*' : escapeRegExp(objectInfo.ObjectName),
                      ),
                    ),
                  ])
              : [],
          },
        ],
        principal: {
          /* account */ type: value.match(ADDRESS_RE)
            ? PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT
            : PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP,
          value,
        },
        expirationTime: toTimestamp(expiration!.toDate()),
      };
    });

    if (payloads.length) {
      setLoading(true);

      dispatch(
        setStatusDetail({ title: 'Updating Access', icon: Animates.access, desc: WALLET_CONFIRM }),
      );

      const [res, error, ids] = await (isFolder
        ? putBucketPolicies(connector!, bucketName, payloads, deleteBucketPolicy, loginAccount)
        : putObjectPolicies(connector!, bucketName, objectInfo.ObjectName, payloads));

      setLoading(false);
      if (!res && !error) {
        setInvalidIds(ids!);
        dispatch(setStatusDetail({} as TStatusDetail));
        return;
      }
      if (error) return errorHandler(error);
      dispatch(setStatusDetail({} as TStatusDetail));
    }

    setValues([]);
    toast.success({ description: 'Access updated!' });
    updateMemberList(values[0]);
  };

  const onRemoveMember = async () => {
    if (!isFolder) {
      setLoading(true);
      dispatch(
        setStatusDetail({ title: 'Updating Access', icon: Animates.access, desc: WALLET_CONFIRM }),
      );
      const [res, error] = await deleteObjectPolicy(
        connector!,
        bucketName,
        objectInfo.ObjectName,
        loginAccount,
        removeAccount,
      );
      setLoading(false);
      if (error) return errorHandler(error);
      dispatch(setStatusDetail({} as TStatusDetail));
      toast.success({ description: 'Access updated!' });
      updateMemberList(removeAccount[0], true);
    } else {
      await onAddMember(removeAccount);
    }
    dispatch(setObjectShareSelectedMembers(without(objectShareSelectedMembers, ...removeAccount)));
  };

  const onSelectChange = (value: string) => {
    dispatch(setObjectShareSelectedMembers(xor(objectShareSelectedMembers, [value])));
  };

  const onSelectAllChange = () => {
    if (allChecked) {
      // cancel all
      dispatch(setObjectShareSelectedMembers(without(objectShareSelectedMembers, ...accounts)));
    } else {
      // select all
      dispatch(setObjectShareSelectedMembers(uniq(objectShareSelectedMembers.concat(accounts))));
    }
  };

  useAsyncEffect(async () => {
    if (!bucketName) return;
    dispatch(setupObjectPolicies(bucketName, objectInfo.ObjectName));
  }, [dispatch, bucketName]);

  useMount(() => {
    dispatch(setupGroupList(loginAccount));
  });

  useUnmount(() => {
    dispatch(setObjectPolicyListPage(0));
    dispatch(setObjectShareSelectedMembers([]));
  });

  useEffect(() => {
    if (members > MAX_COUNT) {
      toast.error({
        description: `Exceed the permission limit (${MAX_COUNT}). Please select fewer items or repeat this action multiple times.`,
      });
    }
  }, [members]);

  return (
    <>
      <GAContextProvider prefix={'add_object_policy_confirm'}>
        <TxConfirmModal
          confirmText="Confirm"
          isOpen={confirmModal}
          title="Allow Access"
          fee={putFee}
          onConfirm={onAddMember}
          onClose={() => {
            setConfirmModal(false);
          }}
          description="Please confirm the transaction in your wallet."
        />
      </GAContextProvider>
      <GAContextProvider prefix={'remove_object_policy_confirm'}>
        <TxConfirmModal
          confirmText="Remove"
          isOpen={deleteModal}
          title="Remove Access"
          fee={deleteFee}
          onConfirm={onRemoveMember}
          onClose={() => {
            setDeleteModal(false);
          }}
          variant={'scene'}
          description={
            removeAccount.length === 1
              ? 'Please confirm the transaction in your wallet.'
              : 'Are you sure you want to remove access to these addresses?'
          }
        />
      </GAContextProvider>
      <FormItem>
        <Flex gap={12}>
          <DCComboBox
            dateChange={setExpiration}
            mode="tags"
            optionFilterProp="label"
            value={values}
            onChange={_onChange}
            tokenSeparators={[',']}
            placeholder="Enter addresses / group IDs, comma separated"
            bordered={false}
            options={options}
            searchValue={searchValue}
            onSearch={setSearchValue}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              if (values.includes(searchValue)) setSearchValue('');
            }}
            open={open && !!_options.length}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            suffixIcon={
              <Text color="#1E2026" fontSize={14}>
                Viewer
              </Text>
            }
            tagRender={(props) => (
              <RenderItem
                invalidIds={invalidIds}
                group={options.some((i) => i.value === props.value)}
                value={props}
              />
            )}
            dropdownRender={() =>
              !_options.length && searchValue ? (
                <></>
              ) : (
                <>
                  <Text
                    fontWeight={500}
                    lineHeight="15px"
                    padding="8px 16px"
                    fontSize={12}
                    borderBottom="1px solid #E6E8EA"
                    bg="#f5f5f5"
                    position="sticky"
                    top={0}
                  >
                    My Groups ({_options.length})
                  </Text>
                  <ScrollContent>
                    {_options.map((item) => {
                      const selected = values.includes(item.value);
                      return (
                        <Flex
                          key={item.value}
                          alignItems="center"
                          h={47}
                          bg={selected ? '#E5F8EB' : '#fff'}
                          cursor="pointer"
                          _hover={{
                            bg: selected ? '#E5F8EB' : '#F5F5F5',
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => _onSelected(item.value)}
                        >
                          <Grid
                            w={32}
                            placeItems="center"
                            visibility={selected ? 'visible' : 'hidden'}
                          >
                            <IconFont type="colored-check" w={16} />
                          </Grid>
                          <Box flex={1} minW={0}>
                            <Flex>
                              <Text
                                flex={1}
                                maxW="max-content"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                textOverflow="ellipsis"
                                mr={4}
                                title={item.label}
                              >
                                {item.label}
                              </Text>
                              {'| ' + item.value}
                            </Flex>
                            <Flex>
                              <Text
                                noOfLines={1}
                                fontSize={12}
                                color="#76808F"
                                fontWeight={400}
                                lineHeight="12px"
                                title={item.desc}
                              >
                                {item.desc || '-'}
                              </Text>
                            </Flex>
                          </Box>
                          <Grid mx={8}>
                            <IconFont type="group-thumbnail" w={20} />
                          </Grid>
                        </Flex>
                      );
                    })}
                  </ScrollContent>
                </>
              )
            }
          />
          <DCButton
            size={'lg'}
            onClick={() => {
              _onChange(values);
              if (!values.length || loading || invalid) return;
              setConfirmModal(true);
            }}
            w={90}
          >
            Add
          </DCButton>
        </Flex>
        {invalid && (
          <Text color="#EE3911">
            {!invalidIds.length
              ? groups.length > MAX_GROUP
                ? `Exceed the group limit (${MAX_GROUP})`
                : error
              : 'Invalid addresses or group IDs.\n'}
          </Text>
        )}
        <Box my={24}>
          <Divider />
          {memberListLoading ? (
            <Loading my={24} />
          ) : (
            <>
              <Thead>
                <DCCheckbox
                  indeterminate={indeterminate && !allChecked}
                  checked={allChecked}
                  onChange={onSelectAllChange}
                  disabled={!accounts.length}
                >
                  <Text fontWeight={600} color={'readable.normal'}>
                    People with Access{members > 0 && `(${members})`}
                  </Text>
                </DCCheckbox>
                <RemoveBtn
                  className={cn({ disabled: !members || members > MAX_COUNT })}
                  onClick={() => {
                    if (!members || members > MAX_COUNT) return;
                    setRemoveAccount(objectShareSelectedMembers);
                    setDeleteModal(true);
                  }}
                >
                  Remove
                </RemoveBtn>
              </Thead>
              <Flex direction="column" gap={8}>
                {page.map((p, index) => {
                  const owner = loginAccount === p.PrincipalValue;
                  const isGroup = p.PrincipalValue.match(GROUP_ID);
                  const expirationTime = p.ExpirationTime ? p.ExpirationTime * 1000 : 0;
                  return (
                    <Row
                      key={p.PrincipalValue}
                      className={cn({
                        'select-disabled': owner,
                        selected: objectShareSelectedMembers.includes(p.PrincipalValue),
                      })}
                    >
                      <DCCheckbox
                        disabled={owner}
                        checked={objectShareSelectedMembers.includes(p.PrincipalValue)}
                        onChange={() => onSelectChange(p.PrincipalValue)}
                      >
                        <Flex key={p.PrincipalValue + String(index)} alignItems="center" h={40}>
                          <Box key={p.PrincipalValue} title={p.PrincipalValue}>
                            <Avatar id={p.PrincipalValue} w={32} />
                          </Box>
                          <Flex lineHeight="normal" ml={8} flex={1} flexDirection="column">
                            <Text
                              flex={1}
                              fontWeight={500}
                              title={p.PrincipalValue}
                              color={'readable.normal'}
                              lineHeight="17px"
                            >
                              {isGroup ? p.PrincipalValue : trimAddress(p.PrincipalValue)}
                              {owner && <> (you)</>}
                            </Text>
                            {!owner && !!expirationTime && (
                              <Text
                                fontSize={12}
                                mt={2}
                                lineHeight="15px"
                                color={
                                  dayjs().isBefore(dayjs(expirationTime))
                                    ? 'readable.disabled'
                                    : 'scene.danger.normal'
                                }
                              >
                                Expire date: {dayjs(expirationTime).format('D MMM, YYYY')}
                              </Text>
                            )}
                          </Flex>
                        </Flex>
                      </DCCheckbox>
                      <Operation>
                        {owner ? (
                          <Text mr={4}>Owner</Text>
                        ) : (
                          <DCMenu
                            zIndex={1300}
                            strategy="fixed"
                            value="viewer"
                            selectIcon
                            placement="bottom-start"
                            options={menus}
                            onMenuSelect={({ value }) => {
                              if (value !== 'remove') return;
                              setRemoveAccount([p.PrincipalValue]);
                              setDeleteModal(true);
                            }}
                          >
                            {({ isOpen }) => (
                              <StyledMenuButton as={Text}>
                                Viewer
                                <IconFont type={isOpen ? 'menu-open' : 'menu-close'} w={16} />
                              </StyledMenuButton>
                            )}
                          </DCMenu>
                        )}
                      </Operation>
                    </Row>
                  );
                })}
              </Flex>
              {memberList.length > MEMBER_SIZE && (
                <SimplePagination
                  pageSize={MEMBER_SIZE}
                  canNext={canNext}
                  canPrev={canPrev}
                  pageChange={onPageChange}
                  simple
                />
              )}
            </>
          )}
        </Box>
      </FormItem>
    </>
  );
});

const RemoveBtn = styled.span`
  font-weight: 500;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;

  &.disabled {
    cursor: not-allowed;
    color: var(--ui-colors-readable-disable);
  }

  :not(.disabled):hover {
    background: #f5f5f5;
  }
`;

const Thead = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  height: 36px;
  margin: 8px 0;
  position: relative;

  .ant-checkbox {
    margin: 2px;
  }
`;

const Row = styled(Flex)`
  position: relative;

  .ant-checkbox-wrapper {
    flex: 1;
  }

  :not(.select-disabled, .selected):hover {
    background: var(--ui-colors-bg-bottom);
  }

  .ant-checkbox {
    margin: 2px;
  }

  &.selected {
    background: #00ba341a;
  }
`;

const Operation = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const FormItem = styled.div``;

const ScrollContent = styled.div`
    overflow: auto;
    max-height: 282px;

    &::-webkit-scrollbar {
        width: 4px
    }

    &::-webkit-scrollbar-thumb {
        background: #E6E8EA;
        border-radius: 4px
`;

const StyledMenuButton = styled(MenuButton)`
  display: inline-flex;
  cursor: pointer;
  padding: 2px 0 2px 4px;
  border-radius: 2px;
  //
  //:hover {
  //  background: #f5f5f5;
  //}
`;
