import * as React from 'react';
import { memo, useState } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  rgba,
  Text,
  toast,
} from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import { deleteObjectPolicy, putObjectPolicies } from '@/facade/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import {
  setObjectPoliciesPage,
  setStatusDetail,
  setupObjectPolicies,
  TStatusDetail,
} from '@/store/slices/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import {
  BUTTON_GOT_IT,
  FILE_ACCESS,
  FILE_ACCESS_URL,
  FILE_FAILED_URL,
  FILE_STATUS_ACCESS,
} from '@/modules/file/constant';
import {
  MsgDeletePolicyTypeUrl,
  MsgPutPolicyTypeUrl,
  PermissionTypes,
} from '@bnb-chain/greenfield-js-sdk';
import { useAsyncEffect, useMount, useUnmount } from 'ahooks';
import { selectGroupList, setMemberListPage, setupGroups } from '@/store/slices/group';
import GroupIcon from '@/public/images/icons/group_icon.svg';
import TickIcon from '@/components/common/SvgIcon/TickIcon.svg';
import { without } from 'lodash-es';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { ADDRESS_RE } from '@/utils/regex';
import { useTableNav } from '@/components/common/DCTable/useTableNav';
import { PolicyMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { Loading } from '@/components/common/Loading';
import { GROUP_MEMBER_AVATARS } from '@/modules/group/components/GroupDetail';
import { trimAddress } from '@/utils/string';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { SimplePagination } from '@/components/common/DCTable/SimplePagination';
import { OBJECT_POLICY_GROUP_AVATARS } from '@/modules/object/components/SharePermission';
import { ConfirmModal } from '@/components/common/DCModal/ConfirmModal';

const MAX_COUNT = 20;
const MEMBER_SIZE = 20;

interface ViewerListProps {}

export const ViewerList = memo<ViewerListProps>(function ViewerList() {
  const [values, setValues] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const { connector } = useAccount();
  const { editShare, bucketName, objectPolicies, objectPoliciesPage } = useAppSelector(
    (root) => root.object,
  );
  const { record: editDetail } = editShare;
  const { loginAccount } = useAppSelector((root) => root.persist);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const { setOpenAuthModal } = useOffChainAuth();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const path = [bucketName, editDetail.objectName].join('/');
  const memberList = objectPolicies[path] || [];
  const memberListLoading = editDetail.name && !(path in objectPolicies);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const [confirmModal, setConfirmModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [removeAccount, setRemoveAccount] = useState('');
  const [error, setError] = useState('');

  const { page, canPrev, canNext } = useTableNav<PolicyMeta>({
    list: memberList,
    sorter: ['CreateTimestamp', 'descend'],
    pageSize: MEMBER_SIZE,
    currentPage: objectPoliciesPage,
  });

  useAsyncEffect(async () => {
    if (!editDetail.name || !bucketName) return;
    dispatch(setupObjectPolicies(bucketName, editDetail.objectName));
  }, [dispatch, editDetail.name, bucketName]);

  useUnmount(() => {
    dispatch(setObjectPoliciesPage(0));
  });

  const _onChange = (e: string[]) => {
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
      return dispatch(setObjectPoliciesPage(objectPoliciesPage + (next ? 1 : -1)));
    }
    dispatch(setObjectPoliciesPage(0));
  };

  const invalid = !!error || !!invalidIds.length;

  const onError = (type: string) => {
    switch (type) {
      case E_OFF_CHAIN_AUTH:
        setOpenAuthModal();
        return;
      default:
        dispatch(
          setStatusDetail({
            title: FILE_ACCESS,
            icon: FILE_FAILED_URL,
            buttonText: BUTTON_GOT_IT,
            buttonOnClick: () => dispatch(setStatusDetail({} as TStatusDetail)),
            errorText: 'Error message: ' + type,
          }),
        );
        return;
    }
  };

  const updateMemberList = async (checkId: string, remove = false) => {
    dispatch(setMemberListPage(0));
    const fetch = () => {
      return dispatch(setupObjectPolicies(bucketName, editDetail.objectName));
    };
    const members = await fetch();

    const needReFetch = remove
      ? members.some((m) => m.PrincipalValue === checkId)
      : members.every((m) => m.PrincipalValue !== checkId);

    if (!needReFetch) return;
    setTimeout(fetch, 1000);
  };

  const onAddMember = async () => {
    if (!values.length || loading || invalid) return;
    const payloads = values
      .filter((v) => !memberList.some((m) => m.PrincipalValue === v))
      .map((value) => ({
        operator: loginAccount,
        // allow, get
        statements: [
          {
            effect: PermissionTypes.Effect.EFFECT_ALLOW,
            actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
            resources: [],
          },
        ],
        principal: {
          /* account */ type: value.match(ADDRESS_RE)
            ? PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT
            : PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP,
          value,
        },
      }));

    if (payloads.length) {
      setLoading(true);
      dispatch(
        setStatusDetail({ title: FILE_ACCESS, icon: FILE_ACCESS_URL, desc: FILE_STATUS_ACCESS }),
      );
      const [res, error, ids] = await putObjectPolicies(
        connector!,
        bucketName,
        editDetail.objectName,
        payloads,
      );
      setLoading(false);
      if (!res && !error) {
        setInvalidIds(ids!);
        dispatch(setStatusDetail({} as TStatusDetail));
        return;
      }
      if (error) return onError(error);
      dispatch(setStatusDetail({} as TStatusDetail));
    }

    setValues([]);
    toast.success({ description: 'Access updated!' });
    updateMemberList(values[0]);
  };

  const onRemoveMember = async () => {
    setLoading(true);
    dispatch(
      setStatusDetail({ title: FILE_ACCESS, icon: FILE_ACCESS_URL, desc: FILE_STATUS_ACCESS }),
    );
    const [res, error] = await deleteObjectPolicy(
      connector!,
      bucketName,
      editDetail.objectName,
      loginAccount,
      removeAccount,
    );
    setLoading(false);
    if (error) return onError(error);
    dispatch(setStatusDetail({} as TStatusDetail));
    toast.success({ description: 'Access updated!' });
    updateMemberList(removeAccount, true);
  };

  useMount(() => {
    dispatch(setupGroups(loginAccount));
  });

  const options = groupList.map((g) => ({ label: g.groupName, value: g.id, desc: g.extra }));

  const _options = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const putFee = (gasObjects?.[MsgPutPolicyTypeUrl]?.gasFee || 0) * values.length;
  const deleteFee = gasObjects?.[MsgDeletePolicyTypeUrl]?.gasFee || 0;

  return (
    <>
      <ConfirmModal
        confirmText="Confirm"
        isOpen={confirmModal}
        ga={{
          gaClickCloseName: 'dc.object.add_object_policy_confirm.modal.show',
          gaShowName: 'dc.object.add_object_policy_confirm.close.click',
          balanceClickName: 'dc.object.add_object_policy_confirm.depost.show',
          balanceShowName: 'dc.object.add_object_policy_confirm.transferin.click',
          cancelButton: 'dc.object.add_object_policy_confirm.cancel.click',
          confirmButton: 'dc.object.add_object_policy_confirm.delete.click',
        }}
        title="Confirm Action"
        fee={putFee}
        onConfirm={onAddMember}
        onClose={() => {
          setConfirmModal(false);
        }}
        description="Confirm this transaction in your wallet."
        variant="dcPrimary"
      />
      <ConfirmModal
        confirmText="Confirm"
        isOpen={deleteModal}
        ga={{
          gaClickCloseName: 'dc.object.remove_object_policy_confirm.modal.show',
          gaShowName: 'dc.object.remove_object_policy_confirm.close.click',
          balanceClickName: 'dc.object.remove_object_policy_confirm.depost.show',
          balanceShowName: 'dc.object.remove_object_policy_confirm.transferin.click',
          cancelButton: 'dc.object.remove_object_policy_confirm.cancel.click',
          confirmButton: 'dc.object.remove_object_policy_confirm.delete.click',
        }}
        title="Confirm Action"
        fee={deleteFee}
        onConfirm={onRemoveMember}
        onClose={() => {
          setDeleteModal(false);
        }}
        description="Confirm this transaction in your wallet."
      />
      <FormItem>
        <FormLabel>People with Access</FormLabel>
        <Flex gap={12}>
          <DCComboBox
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
                            <TickIcon color="#00BA34" />
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
                            <GroupIcon />
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
            variant="dcPrimary"
            onClick={() => {
              _onChange(values);
              if (!values.length || loading || invalid) return;
              setConfirmModal(true);
            }}
            w={90}
            h={48}
          >
            Add
          </DCButton>
        </Flex>
        {invalid && (
          <Text color="#EE3911">
            {!invalidIds.length ? error : 'Invalid addresses or group IDs.\n'}
          </Text>
        )}
        <Box my={8}>
          {memberListLoading ? (
            <Loading my={24} />
          ) : (
            <>
              <Flex direction="column" gap={8}>
                {page.map((p, index) => {
                  const isGroup = !p.PrincipalValue.startsWith('0x');
                  const lastCharCode = p.PrincipalValue[p.PrincipalValue.length - 1].charCodeAt(0);
                  const Avatar = isGroup
                    ? OBJECT_POLICY_GROUP_AVATARS[lastCharCode % 4]
                    : GROUP_MEMBER_AVATARS[lastCharCode % 5];

                  const owner = loginAccount === p.PrincipalValue;
                  return (
                    <Flex key={p.PrincipalValue + String(index)} alignItems="center" h={40}>
                      <Box key={p.PrincipalValue} title={p.PrincipalValue}>
                        <Avatar />
                      </Box>
                      <Text flex={1} ml={8} fontWeight={500} title={p.PrincipalValue}>
                        {trimAddress(p.PrincipalValue)}
                        {owner && <> (you)</>}
                      </Text>
                      {owner ? (
                        'Owner'
                      ) : (
                        <Menu placement="bottom-start">
                          {({ isOpen }) => (
                            <>
                              <StyledMenuButton as={Text}>
                                Viewer
                                {isOpen ? (
                                  <MenuOpenIcon boxSize={16} color="#76808F" />
                                ) : (
                                  <MenuCloseIcon boxSize={16} color="#76808F" />
                                )}
                              </StyledMenuButton>
                              <StyledMenuList>
                                <MenuItem bg={rgba('#00BA34', 0.1)} _hover={{ bg: undefined }}>
                                  <Tick />
                                  Viewer
                                </MenuItem>
                                <MenuItem
                                  _hover={{
                                    bg: 'bg.bottom',
                                  }}
                                  onClick={() => {
                                    setRemoveAccount(p.PrincipalValue);
                                    setDeleteModal(true);
                                  }}
                                >
                                  <Text color="#EE3911">Remove</Text>
                                </MenuItem>
                              </StyledMenuList>
                            </>
                          )}
                        </Menu>
                      )}
                    </Flex>
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

const FormItem = styled.div``;

const FormLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
  margin-bottom: 8px;
`;

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

// todo refactor
const StyledMenuButton = styled(MenuButton)`
  cursor: pointer;
  padding: 2px 0 2px 4px;
  border-radius: 2px;

  :hover {
    background: #f5f5f5;
  }

  svg {
    pointer-events: none;
  }
`;

const StyledMenuList = styled(MenuList)`
  border-radius: 4px;
  border: 1px solid #e6e8ea;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.08);
  margin-top: -6px;

  .ui-menu-item {
    padding-left: 32px;
    font-weight: 400;
  }
`;

const Tick = styled(TickIcon)`
  color: #00ba34;
  position: absolute;
  left: 8px;
`;
