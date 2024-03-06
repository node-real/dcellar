import { IconFont } from '@/components/IconFont';
import { DCMenu } from '@/components/common/DCMenu';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { GAClick } from '@/components/common/GATracker';
import { useAppSelector } from '@/store';
import { MsgUpdateObjectInfoTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import styled from '@emotion/styled';
import { Button, Flex, MenuButton, Text } from '@node-real/uikit';
import { find } from 'lodash-es';
import { memo, useState } from 'react';
import { GAContextProvider } from '@/context/GAContext';
import { selectGnfdGasFeesConfig } from '@/store/slices/global';

interface AccessItemProps {
  value: number;
  onChange: (v: number) => void;
  folder?: boolean;
}

const options = [
  {
    icon: <IconFont w={16} type="private" />,
    label: 'Private',
    desc: 'Only peoples with permission can access the objects.',
    value: '2',
    bg: '#E6E8EA',
  },
  {
    icon: <IconFont w={16} type="public" />,
    label: 'Public',
    desc: 'Anyone with a shared link can access objects.',
    value: '1',
    bg: '#E7F3FD',
  },
  {
    icon: <IconFont w={16} type="public" />,
    label: 'Public',
    desc: 'Anyone with a shared link can access objects.',
    value: '3',
    bg: '#E7F3FD',
  },
];

export const AccessItem = memo<AccessItemProps>(function AccessItem({
  value,
  onChange = () => {},
  folder = false,
}) {
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);

  const [_value, setValue] = useState<number>(1);
  const [confirmModal, setConfirmModal] = useState(false);

  const fee = gnfdGasFeesConfig?.[MsgUpdateObjectInfoTypeUrl]?.gasFee || 0;
  const valueOption = find(options, (o) => String(o.value) === String(value)) || options[0];

  return (
    <>
      <GAContextProvider prefix={'update_object_info_confirm'}>
        <TxConfirmModal
          confirmText="Confirm"
          isOpen={confirmModal}
          title="Access Update"
          fee={fee}
          onConfirm={() => onChange(_value)}
          onClose={() => {
            setConfirmModal(false);
          }}
          description={`Are you sure to change the object to "${
            _value === 1 ? 'Public' : 'Private'
          }"?`}
        />
      </GAContextProvider>
      <FormItem>
        <FormLabel>General Access</FormLabel>
        <Flex alignItems="center" py={8}>
          <AccessStatus $bg={valueOption.bg}>{valueOption.icon}</AccessStatus>
          <Flex flexDirection="column" py={2} alignItems="flex-start">
            {folder ? (
              <Text fontWeight={500}>{valueOption.label}</Text>
            ) : (
              <DCMenu
                placement="bottom-start"
                selectIcon
                value={valueOption.value}
                options={options.filter((o) => o.value !== '3')}
                menuListProps={{ w: 456 }}
                onMenuSelect={({ value }) => {
                  setValue(Number(value));
                  setConfirmModal(true);
                }}
                renderOption={({ value, label }) => (
                  <Flex flexDirection={'column'}>
                    <OptionTitle>{label}</OptionTitle>
                    <OptionDesc>{options[value === '1' ? 1 : 0].desc}</OptionDesc>
                  </Flex>
                )}
              >
                {({ isOpen }) => (
                  <GAClick name="dc.file.share_m.access.click">
                    <StyledButton
                      as={Button}
                      rightIcon={<IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />}
                    >
                      {valueOption.label}
                    </StyledButton>
                  </GAClick>
                )}
              </DCMenu>
            )}

            <Text fontWeight="400" fontSize={12} lineHeight="15px" color="#76808F">
              {valueOption.desc}
            </Text>
          </Flex>
          {valueOption.value === '1' && (
            <Text flex={1} align="right">
              Viewer
            </Text>
          )}
        </Flex>
      </FormItem>
    </>
  );
});
const OptionTitle = styled(Text)`
  font-size: 14px;
  line-height: 17px;
  color: #474d57;

  svg {
    position: absolute;
    transform: translateX(-22px);
  }
`;

const OptionDesc = styled(Text)`
  font-size: 12px;
  line-height: 18px;
  color: #76808f;
`;

const StyledButton = styled(MenuButton)`
  height: auto;

  svg {
    pointer-events: none;
    color: #76808f;
    margin-left: 2px;
    width: 16px;
    height: 16px;
  }

  background: transparent;
  color: #1e2026;

  :hover {
    background: transparent;
  }

  padding: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
`;

const AccessStatus = styled.div<{ $bg: string }>`
  width: 32px;
  height: 32px;
  font-size: 16px;
  background: #e6e8ea;
  display: grid;
  place-items: center;
  border-radius: 100%;
  margin-right: 8px;
  background: ${(props) => props.$bg};
`;

const FormItem = styled.div`
  position: relative;
`;

const FormLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
  margin-bottom: 8px;
`;
