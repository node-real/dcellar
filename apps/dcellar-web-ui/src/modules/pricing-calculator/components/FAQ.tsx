import {
  Link,
  QAccordion,
  QAccordionButton,
  QAccordionIcon,
  QAccordionItem,
  QAccordionPanel,
  Text,
} from '@totejs/uikit';
import { PriceResponsiveContainer } from '..';
import { H2 } from './Common';
import { UnderlineLink } from '@/components/layout/Footer';

export const FAQ = () => {
  const data = [
    {
      question: 'What is Charged Size?',
      answer: (
        <Text>
          The ChargeSize is calculated from the object's payload size, if the payload size is less
          than 128k then ChargeSize is 128k, otherwise ChargeSize is equal to payload size.
          <Text>If Data Size &lt; 128K, ChargedSize = 128K; else, ChargedSize = Data Size</Text>
          <Text>If object is an empty folder, ChargedSize = 128K</Text>
        </Text>
      ),
    },
    {
      question: 'What is Primary/Secondary Store Price?',
      answer: (
        <Text>
          Every SP can set their own suggested store price and read price via on-chain transactions.
          At the first block of each month, the median all SPs' store prices will be calculated as
          the Primary SP Store Price, the Secondary SP Store Price will be calculated as a
          proportion of the Primary SP Store Price (e.g. 12%, which can be governed), and the median
          of all SPs' read prices will be calculated as the Primary SP Read Price. To learn more
          about it, please refer to{' '}
          <UnderlineLink target='_blank' href="https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/billing-and-payment#storage-fee-price-and-adjustment">
            https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/billing-and-payment#storage-fee-price-and-adjustment
          </UnderlineLink>.
        </Text>
      ),
    },
    {
      question: 'What is Validator Tax Rate?',
      answer: (
        <>
          For each data related operation on Greenfield, validators can get some rewards for
          protecting the security and integrity of data (i.e. challenge). Through charging validator
          tax, part of user's cost will go to validator tax pool, and then become validators'
          rewards.
        </>
      ),
    },
    {
      question: 'What is Read Price?',
      answer: (
        <>
          A storage provider can update its free read quote, suggested primary store price and read
          price. All SPs' suggested primary store and read prices will be used to generate the
          global primary/secondary store price and read price.
        </>
      ),
    },
    {
      question: 'What is Reserve Time?',
      answer: (
        <Text>
          The storage fee will be charged on Greenfield in a steam payment style. The fees are paid
          on Greenfield in the style of "Stream" from users to receiver accounts at a constant rate.
          By reseveing some balance, users do not need to payment the fee in a very high frequency.
          Currently, the reserve time is 6 months and it can be governed.
        </Text>
      ),
    },
  ];
  return (
    <PriceResponsiveContainer>
      <H2>FAQ</H2>
      <QAccordion>
        {data.map((item, index) => (
          <QAccordionItem key={index}>
            <QAccordionButton h={56} fontSize={16} fontWeight={600}>
              {item.question}
              <QAccordionIcon />
            </QAccordionButton>
            <QAccordionPanel color={'readable.tertiary'} fontSize={14}>
              {item.answer}
            </QAccordionPanel>
          </QAccordionItem>
        ))}
      </QAccordion>
    </PriceResponsiveContainer>
  );
};
