import * as React from 'react';
import { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Box, Flex, Grid, Text, toast } from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import { putObjectPolicies } from '@/facade/object';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { E_OFF_CHAIN_AUTH } from '@/facade/error';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import {
  BUTTON_GOT_IT,
  FILE_ACCESS,
  FILE_ACCESS_URL,
  FILE_FAILED_URL,
  FILE_STATUS_ACCESS,
} from '@/modules/file/constant';
import { PermissionTypes } from '@bnb-chain/greenfield-js-sdk';
import { useMount } from 'ahooks';
import { selectGroupList, setupGroups } from '@/store/slices/group';
import GroupIcon from '@/public/images/icons/group_icon.svg';
import TickIcon from '@/components/common/SvgIcon/TickIcon.svg';
import { without } from 'lodash-es';
import { RenderItem } from '@/components/common/DCComboBox/RenderItem';
import { ADDRESS_RE } from '@/utils/regex';

const MAX_COUNT = 20;

interface ViewerListProps {}

export const ViewerList = memo<ViewerListProps>(function ViewerList() {
  const [values, setValues] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const { connector } = useAccount();
  const { editDetail, bucketName } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const groupList = useAppSelector(selectGroupList(loginAccount));
  const { setOpenAuthModal } = useOffChainAuth();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);

  const _onChange = (e: string[]) => {
    setValues(e);
    setInvalidIds((ids) => ids.filter((id) => e.includes(id)));
    setSearchValue('');
  };

  const _onSelected = (s: string) => {
    const newValues = values.includes(s) ? without(values, s) : [...values, s];
    _onChange(newValues);
  };

  const inValid = values.length > MAX_COUNT || !!invalidIds.length;

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

  const onInvite = async () => {
    if (!values.length || loading || inValid) return;
    const payloads = values.map((value) => ({
      operator: loginAccount,
      // allow, get
      statements: [
        {
          effect: PermissionTypes.Effect.EFFECT_ALLOW,
          actions: [PermissionTypes.ActionType.ACTION_GET_OBJECT],
          resources: [''],
        },
      ],
      principal: {
        /* account */ type: value.match(ADDRESS_RE)
          ? PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT
          : PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_GROUP,
        value,
      },
    }));
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
    setValues([]);
    toast.success({ description: 'Access updated!' });
  };

  useMount(() => {
    dispatch(setupGroups(loginAccount));
  });

  const options = groupList.map((g) => ({ label: g.groupName, value: g.id, desc: g.extra }));

  const _options = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
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
        <DCButton variant="dcPrimary" onClick={onInvite} w={90} h={48}>
          Invite
        </DCButton>
      </Flex>
      {inValid && (
        <Text color="#EE3911">
          {!invalidIds.length
            ? `Please enter less than ${MAX_COUNT} addresses.`
            : 'Invalid addresses or group IDs.\n'}
        </Text>
      )}
    </FormItem>
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
