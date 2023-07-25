import { memo } from 'react';
import styled from '@emotion/styled';
import { Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from '@totejs/uikit';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { find } from 'lodash-es';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';
import { GAClick } from '@/components/common/GATracker';
import SelectedIcon from '@/public/images/files/icons/selected.svg';

interface AccessItemProps {
  value: number;
  onChange: (v: number) => void;
}

const options = [
  {
    icon: <PrivateFileIcon fillColor="#1E2026" w={16} h={16} />,
    label: 'Private',
    desc: 'Only me can open with the link.',
    value: 2,
    bg: '#E6E8EA',
  },
  {
    icon: <PublicFileIcon fillColor="#1E2026" w={16} h={16} />,
    label: 'Public',
    desc: 'Anyone with the link can open at anytime and can find in explorer.',
    value: 1,
    bg: '#E7F3FD',
  },
];

export const AccessItem = memo<AccessItemProps>(function AccessItem({
  value,
  onChange = () => {},
}) {
  const valueOption = find(options, (o) => o.value === value) || options[0];

  return (
    <FormItem>
      <FormLabel>General Access</FormLabel>
      <Flex alignItems="center" py={8}>
        <AccessStatus $bg={valueOption.bg}>{valueOption.icon}</AccessStatus>
        <Flex flexDirection="column" py={2} alignItems="flex-start">
          <Menu placement="bottom-start">
            {({ isOpen }) => (
              <>
                <GAClick name="dc.file.share_m.access.click">
                  <StyledButton
                    as={Button}
                    rightIcon={isOpen ? <MenuOpenIcon /> : <MenuCloseIcon />}
                  >
                    {valueOption.label}
                  </StyledButton>
                </GAClick>
                <StyledMenuList w={456}>
                  {options.map((option) => (
                    <StyledItem
                      $active={option.value === value}
                      key={option.value}
                      onClick={() => {
                        if (option.value === value) return;
                        onChange(option.value);
                      }}
                    >
                      <OptionTitle>
                        {option.value === value && <SelectedIcon />}
                        {option.label}
                      </OptionTitle>
                      <OptionDesc>{option.desc}</OptionDesc>
                    </StyledItem>
                  ))}
                </StyledMenuList>
              </>
            )}
          </Menu>
          <Text fontWeight="400" fontSize={12} lineHeight="15px" color="#76808F">
            {valueOption.desc}
          </Text>
        </Flex>
        {valueOption.value === 1 && (
          <Text flex={1} align="right">
            Viewer
          </Text>
        )}
      </Flex>
    </FormItem>
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

const StyledItem = styled(MenuItem, transientOptions)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 24px 8px 32px;
  ${(props) =>
    props.$active &&
    css`
      &.ui-menu-item {
        background: rgba(0, 186, 52, 0.1);
      }
    `}
`;

const StyledMenuList = styled(MenuList)``;

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

const FormItem = styled.div``;

const FormLabel = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
  margin-bottom: 8px;
`;
