import { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Text, toast } from '@totejs/uikit';
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
import { PermissionTypes } from '@bnb-chain/greenfield-chain-sdk';

const MAX_COUNT = 20;

interface ViewerListProps {}

export const ViewerList = memo<ViewerListProps>(function ViewerList() {
  const [values, setValues] = useState<string[]>([]);
  const { connector } = useAccount();
  const { editDetail, bucketName } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { setOpenAuthModal } = useOffChainAuth();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const _onChange = (e: string[]) => {
    setValues(e.filter((i) => i.match(/0x[a-z0-9]{40}/i)));
  };

  const inValid = values.length > MAX_COUNT;

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
    if (!values.length || loading) return;
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
        /* account */ type: PermissionTypes.PrincipalType.PRINCIPAL_TYPE_GNFD_ACCOUNT,
        value,
      },
    }));
    setLoading(true);
    dispatch(
      setStatusDetail({ title: FILE_ACCESS, icon: FILE_ACCESS_URL, desc: FILE_STATUS_ACCESS }),
    );
    const [res, error] = await putObjectPolicies(
      connector!,
      bucketName,
      editDetail.objectName,
      payloads,
    );
    setLoading(false);
    if (error) return onError(error);
    dispatch(setStatusDetail({} as TStatusDetail));
    setValues([]);
    toast.success({ description: 'Access updated!' });
  };

  return (
    <FormItem>
      <FormLabel>People with Access</FormLabel>
      <Flex gap={12}>
        <Input>
          <DCComboBox
            maxTagCount={20}
            value={values}
            onChange={_onChange}
            tokenSeparators={[',']}
            placeholder="Add address, comma separated"
            bordered={false}
            suffixIcon={null}
            mode="tags"
          />
          <Text>Viewer</Text>
        </Input>
        <DCButton variant="dcPrimary" onClick={onInvite} w={90} h={48}>
          Invite
        </DCButton>
      </Flex>
      {inValid && <Text color="#EE3911">Please enter less than 20 addresses. </Text>}
    </FormItem>
  );
});

const Input = styled(Flex)`
  min-width: 0;
  padding: 8px;
  flex: 1;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #00ba34;
  background: #fff;
  > div:first-of-type {
    flex: 1;
    min-width: 0;
    .ant-select-selector {
      padding-right: 0;
      padding-inline-end: 0;
      padding-left: 0;
    }
  }
  .ant-select-selection-placeholder {
    color: #76808f;
    font-family: Inter, sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: normal;
  }
  .ant-select-selection-search-input,
  .ant-select-selection-item-content {
    font-size: 12px;
    font-family: Inter, sans-serif;
    line-height: 24px;
  }
`;

const FormItem = styled.div``;

const FormLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
  margin-bottom: 8px;
`;
