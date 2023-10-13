import {
  Box,
  QAccordion,
  QAccordionButton,
  QAccordionIcon,
  QAccordionItem,
  QAccordionPanel,
  Table,
  Text,
} from '@totejs/uikit';
import { PriceResponsiveContainer } from '..';
import { H2 } from './Common';
import { UnderlineLink } from '@/components/layout/Footer';
import { ReactElement } from 'react';

type TBillingFormula = {
  id: number;
  name: string;
  value: ReactElement;
};
const BillingFormula = () => {
  const columns = [
    {
      header: (
        <Text as='div' fontSize={16} fontWeight={600}>
          Fee
        </Text>
      ),
      width: '20%',
      cell: (item: TBillingFormula) => {
        return <Box minW={130}>{item.name}</Box>;
      },
    },
    {
      header: (
        <Text as='div' fontSize={16} fontWeight={600}>
          Billing Formula
        </Text>
      ),
      cell: (item: TBillingFormula) => {
        return <Box>{item.value}</Box>;
      },
    },
  ];

  const data: TBillingFormula[] = [
    {
      id: 1,
      name: 'Storage Fee',
      value: (
        <>
          <Text as='div' marginBottom={16} fontWeight={400} wordBreak={'break-all'}>
            Fee = sum(ChargedSize) * (PrimaryStorePrice + SecondaryStorePrice*SecondarySPNumber) *
            (1+Validator Tax Rate) * ReserveTime
          </Text>
          <Text as='div' fontWeight={400}>ReserveTime = 180</Text>
          <Text as='div' fontWeight={400}>Validator Tax Rate = 1%</Text>
        </>
      ),
    },
    {
      id: 2,
      name: 'Download Quota Fee',
      value: (
        <Text as='div' fontWeight={400} wordBreak={'break-all'}>
          Fee = ChargedReadQuota * ReadPrice * (1 + Validator Tax Rate) * ReserveTime
        </Text>
      ),
    },
  ];

  return (
    <Table
      containerStyle={{
        padding: '0',
        marginY: '16px',
        border: '1px solid readable.border',
        borderRadius: '4px',
      }}
      width={'100%'}
      columns={columns}
      data={data}
      withContainer={true}
      thProps={{ bgColor: 'bg.bottom', paddingX: '16px' }}
      tdProps={{
        padding: '8px 16px',
        whiteSpace: 'break-spaces',
      }}
    ></Table>
  );
};
export const FAQ = () => {
  const data = [
    {
      question: <Text id='#billing-formula'>Billing Formula</Text>,
      answer: (
        <>
          <Text as='div'>
            In Greenfield, Besides transaction fee, users are required to pay two kinds of storage
            service fees: storage fee and download quota fee. These storage service fees are charged
            by Storage Providers (SPs) in a steam payment. Users need to prelock an amount of
            storage service fee when they start using the service.
          </Text>
          <BillingFormula />
        </>
      ),
    },
    {
      question: 'What is Charged Size?',
      answer: (
        <Text as='div'>
          The ChargeSize is calculated from the object's payload size, if the payload size is less
          than 128k then ChargeSize is 128k, otherwise ChargeSize is equal to payload size.
          <Text as='div'>If Data Size &lt; 128K, ChargedSize = 128K; else, ChargedSize = Data Size</Text>
          <Text as='div'>If object is an empty folder, ChargedSize = 128K</Text>
        </Text>
      ),
    },
    {
      question: 'What is Primary/Secondary Store Price?',
      answer: (
        <Text as={'div'}>
          Every SP can set their own suggested store price and read price via on-chain transactions.
          At the first block of each month, the median all SPs' store prices will be calculated as
          the Primary SP Store Price, the Secondary SP Store Price will be calculated as a
          proportion of the Primary SP Store Price (e.g. 12%, which can be governed), and the median
          of all SPs' read prices will be calculated as the Primary SP Read Price. To learn more
          about it, please refer to{' '}
          <UnderlineLink
            target="_blank"
            href="https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/billing-and-payment#storage-fee-price-and-adjustment"
          >
            https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/billing-and-payment#storage-fee-price-and-adjustment
          </UnderlineLink>
          .
        </Text>
      ),
    },
    {
      question: 'What is Validator Tax Rate?',
      answer: (
        <Text as='div'>
          For each data related operation on Greenfield, validators can get some rewards for
          protecting the security and integrity of data (i.e. challenge). Through charging validator
          tax, part of user's cost will go to validator tax pool, and then become validators'
          rewards.
        </Text>
      ),
    },
    {
      question: 'What is Read Price?',
      answer: (
        <Text as='div'>
          A storage provider can update its free read quote, suggested primary store price and read
          price. All SPs' suggested primary store and read prices will be used to generate the
          global primary/secondary store price and read price.
        </Text>
      ),
    },
    {
      question: 'What is Reserve Time?',
      answer: (
        <Text as='div'>
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
      <H2 id='#faq' marginBottom={'16px'}>FAQ</H2>
      <QAccordion>
        {data.map((item, index) => (
          <QAccordionItem key={index} px={0} >
            <QAccordionButton h={56} fontSize={16} fontWeight={600} px={0}>
              {item.question}
              <QAccordionIcon />
            </QAccordionButton>
            <QAccordionPanel px={0} color={'readable.tertiary'} fontSize={14}>
              {item.answer}
            </QAccordionPanel>
          </QAccordionItem>
        ))}
      </QAccordion>
    </PriceResponsiveContainer>
  );
};
