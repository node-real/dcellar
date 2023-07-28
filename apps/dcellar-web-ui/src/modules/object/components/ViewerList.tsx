import { memo, useState } from 'react';
import styled from '@emotion/styled';
import { Flex, Text } from '@totejs/uikit';
import { DCComboBox } from '@/components/common/DCComboBox';
import { DCButton } from '@/components/common/DCButton';
import { putObjectPolicy } from '@/facade/object';
import { useAppSelector } from '@/store';
import { useAccount } from 'wagmi';
import { MsgPutPolicy } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';

interface ViewerListProps {}

export const ViewerList = memo<ViewerListProps>(function ViewerList() {
  const [values, setValues] = useState<string[]>([]);
  const { connector } = useAccount();
  const { editDetail, bucketName } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);

  const _onChange = (e: string[]) => {
    setValues(e.filter((i) => i.match(/0x[a-z0-9]{40}/i)));
  };

  const onInvite = async () => {
    if (!values.length) return;
    const msg: Omit<MsgPutPolicy, 'resource' | 'expirationTime'> = {
      operator: loginAccount,
      // allow, get
      statements: [{ effect: 1, actions: [6], resources: [''] }],
      principal: {
        // account
        type: 1,
        value: values[0],
      },
    };
    const [res, error] = await putObjectPolicy(connector!, bucketName, editDetail.objectName, msg);
    console.log(values, res, error);
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
        <DCButton variant="dcPrimary" onClick={onInvite}>
          Invite
        </DCButton>
      </Flex>
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
