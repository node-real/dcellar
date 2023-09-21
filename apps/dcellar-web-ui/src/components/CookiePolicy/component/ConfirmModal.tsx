import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Button,
  Modal,
  Divider,
  Flex,
  Link,
  ModalFooter,
  Switch,
  QListItem,
  QAccordion,
  QAccordionItem,
  QAccordionPanel,
  QAccordionButton,
  QAccordionIcon,
} from '@totejs/uikit';
import { SendIcon } from './SendIcon';
// import { reportEvent } from '@node-real/next';

type Props = {
  open: boolean;
  cancelFn: Function;
  confirmFn: Function;
};
export const ConfirmModal: React.FC<Props> = ({ open, cancelFn, confirmFn }) => {
  const [gaAccept, setGaAccept] = useState(true);
  const [stAccept, setStAccept] = useState(true);

  const onConfirmClick = () => {
    if (gaAccept && stAccept) {
      confirmFn('ga_st', 'accept_all');
      return;
    }
    if (stAccept && !gaAccept) {
      confirmFn('st', 'optional');
      return;
    }
    if (gaAccept && !stAccept) {
      confirmFn('ga', 'optional');
      return;
    }
    if (!gaAccept && !stAccept) {
      confirmFn('ga_st', 'deny_all');
      return;
    }
  };

  return (
    <StyledModal isOpen={open} data-testid="modal" onClose={() => cancelFn()}>
      <Title>Cookie Settings</Title>
      <Subtitle>Statistics</Subtitle>
      <Desc>
        Statistic cookies help website owners to understand how visitors interact with websites by
        collecting and reporting information anonymously.
      </Desc>
      <StyleQAccordion>
        <QAccordionItem>
          <QAccordionButton p={0}>
            <StyledListItem
              right={
                <Switch
                  onChange={() => {
                    setGaAccept(!gaAccept);
                    const name = `nr.main.cookie.set_google_${!gaAccept ? 'on' : 'off'}.click`;
                    // reportEvent({ name, data: {} });
                  }}
                  isChecked={gaAccept}
                />
              }
              data-testid={'item'}
            >
              <StyledListItemHeader>
                <QAccordionIcon />
                <div className="title">Google</div>
              </StyledListItemHeader>
            </StyledListItem>
          </QAccordionButton>
          <QAccordionPanel p={0}>
            <StyledChild>
              <div className="cookie_item_title">_ga_#</div>
              <div className="cookie_item_text">
                Used by Google Analytics to collect data on the number of times a user has visited
                the website as well as dates for the first and most recent visit.
              </div>
              <Divider />
              <Flex mt={'16px'}>
                <Flex flex={1} align="center">
                  <Label>Expiry:</Label>
                  <LabelContent>24 months</LabelContent>
                </Flex>
                <Flex flex={1} align={'center'}>
                  <Label>Type:</Label>
                  <LabelContent>HTTP</LabelContent>
                </Flex>
              </Flex>
            </StyledChild>
            <LearnMore>
              <Link
                target="_blank"
                href="https://policies.google.com/privacy"
                fontSize={'12px'}
                fontWeight="600"
                mr="4px"
              >
                Learn more about this provider
              </Link>
              <SendIcon fill="#76808F" />
            </LearnMore>
          </QAccordionPanel>
        </QAccordionItem>
      </StyleQAccordion>
      <StyleQAccordion>
        <QAccordionItem>
          <QAccordionButton p={0}>
            <StyledListItem
              right={
                <div>
                  <StyledSwitch
                    isChecked={stAccept}
                    onChange={() => {
                      setStAccept(!stAccept);
                      const name = `nr.main.cookie.set_sentry_${!stAccept ? 'on' : 'off'}.click`;
                      // reportEvent({ name, data: {} });
                    }}
                  />
                </div>
              }
              data-testid={'item'}
            >
              <StyledListItemHeader>
                <QAccordionIcon />
                <div className="title">Sentry</div>
              </StyledListItemHeader>
            </StyledListItem>
          </QAccordionButton>
          <QAccordionPanel p={0}>
            <StyledChild>
              <div className="cookie_item_text">
                Sentry collects data to enable us to operate the services effectively.
              </div>
              <Divider />
              <Flex mt={'16px'}>
                <Flex flex={1} align="center">
                  <Label>Expiry:</Label>
                  <LabelContent>3 months</LabelContent>
                </Flex>
                <Flex flex={1} align={'center'}>
                  <Label>Type:</Label>
                  <LabelContent>HTTP</LabelContent>
                </Flex>
              </Flex>
            </StyledChild>
            <LearnMore>
              <Link
                target="_blank"
                href="https://sentry.io/privacy/"
                fontSize={'12px'}
                fontWeight="600"
                mr="4px"
              >
                Learn more about this provider
              </Link>
              <SendIcon fill="#76808F" />
            </LearnMore>
          </QAccordionPanel>
        </QAccordionItem>
      </StyleQAccordion>
      <ModalFooter>
        <Flex justify={'space-between'}>
          <CustomButton
            onClick={() => {
              onConfirmClick();
              // reportEvent({ name: 'nr.main.cookie.modal.save.click', data: {} });
            }}
          >
            Save
          </CustomButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

const StyledModal = styled(Modal)`
  .ui-modal-content {
    overflow: auto;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  width: 100%;
  max-width: 406px;
  margin: 0 auto;
`;

export const CustomButton = styled(Button)`
  width: 200px;
  margin: 0 auto;
`;

export const Title = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  word-break: break-word;
  margin-bottom: 24px;
`;

export const Subtitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  word-break: break-word;
  margin-bottom: 16px;
`;

export const Desc = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 21px;
  margin-bottom: 16px;
`;

const StyleQAccordion = styled(QAccordion)`
  border: 1ps solid var(--ui-colors-readable-border);
  border-radius: 8px;
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledListItem = styled(QListItem)<any>`
  :hover {
    background-color: var(--ui-colors-bg-middle);
  }
  .title {
    margin-left: 16px;
    font-weight: 600;
  }
  border-bottom: ${({ showBorder }) =>
    showBorder ? `1px solid var(--ui-colors-readable-border)` : 'none'};
`;

const StyledListItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-items: center;
`;

const StyledChild = styled.div`
  background-color: var(--ui-colors-bg-top-normal);
  border-radius: 8px;
  margin: 16px 12px;
  padding: 16px;
  .cookie_item_title {
    font-weight: 600;
    font-size: 12px;
    line-height: 18px;
    margin-bottom: 16px;
  }
  .cookie_item_text {
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    margin-bottom: 16px;
  }
`;

const Label = styled.span`
  font-weight: 600;
  font-size: 12px;
  line-height: 18px;
  margin-right: 4px;
`;

const LabelContent = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 18px;
`;

const StyledSwitch = styled(Switch)``;

const LearnMore = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
  margin-right: 16px;
`;
