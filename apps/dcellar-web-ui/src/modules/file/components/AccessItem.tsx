import { memo } from 'react';
import styled from '@emotion/styled';
import { Button, Flex, Heading, Menu, MenuButton, MenuItem, MenuList, Text } from '@totejs/uikit';
import { ChainVisibilityEnum } from '@/modules/file/type';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import PrivateFileIcon from '@/modules/file/components/PrivateFileIcon';
import { find } from 'lodash-es';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';
import { GAClick } from '@/components/common/GATracker';

interface AccessItemProps {
  value: string;
  onChange: (v: string) => void;
}

const options = [
  {
    icon: <PrivateFileIcon fillColor="#1E2026" />,
    label: 'Private',
    desc: 'Only me can open with the link.',
    value: ChainVisibilityEnum.VISIBILITY_TYPE_PRIVATE,
  },
  {
    icon: <PublicFileIcon fillColor="#1E2026" />,
    label: 'Public',
    desc: 'Anyone with the link can open at anytime and can find in explorer.',
    value: ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ,
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
      <Flex alignItems="center" margin="10px 0">
        <AccessStatus>{valueOption.icon}</AccessStatus>
        <Flex flexDirection="column" alignItems="flex-start">
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
                <StyledMenuList w={390}>
                  {options.map((option) => (
                    <StyledItem
                      $active={option.value === value}
                      key={option.value}
                      onClick={() => {
                        if (option.value === value) return;
                        onChange(option.value);
                      }}
                    >
                      <OptionTitle>{option.label}</OptionTitle>
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
      </Flex>
    </FormItem>
  );
});
const OptionTitle = styled(Text)`
  font-size: 14px;
  line-height: 17px;
  color: #474d57;
`;

const OptionDesc = styled(Text)`
  font-size: 10px;
  line-height: 18px;
  color: #76808f;
`;

const StyledItem = styled(MenuItem, transientOptions)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 24px;
  ${(props) =>
    props.$active &&
    css`
      &.ui-menu-item {
        background: rgba(0, 186, 52, 0.1);
      }
    `}
`;

const StyledMenuList = styled(MenuList)`
  padding: 8px 0;
`;

const StyledButton = styled(MenuButton)`
  height: auto;
  svg {
    pointer-events: none;
    color: #76808f;
    margin-left: 2px;
    width: 16px;
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

const AccessStatus = styled.div`
  width: 32px;
  height: 32px;
  font-size: 16px;
  background: #e6e8ea;
  display: grid;
  place-items: center;
  border-radius: 100%;
  margin-right: 8px;
`;

const FormItem = styled.div``;

const FormLabel = styled(Heading)`
  font-weight: 500;
  font-size: 14px;
  line-height: 21px;
  margin-bottom: 16px;
`;
