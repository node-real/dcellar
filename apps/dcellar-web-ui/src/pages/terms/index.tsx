import { LandingPage } from '@/components/layout/LandingPage';
import { smMedia } from '@/modules/responsive';
import { Box, Flex, Text, TextProps } from '@node-real/uikit';
import React, { ReactElement } from 'react';

const H1 = ({ children, ...restProps }: TextProps) => (
  <Text as="h1" fontSize={40} fontWeight={700} {...restProps}>
    {children}
  </Text>
);
const H2 = ({ children, ...restProps }: TextProps) => (
  <Text as="h2" fontSize={24} fontWeight={600} {...restProps}>
    {children}
  </Text>
);
const Content = ({ children, ...restProps }: TextProps) => (
  <Text as="p" fontSize={16} fontWeight={400} {...restProps}>
    {children}
  </Text>
);
export default function TermsOfUsePage() {
  return (
    <Box w={'100%'} bgColor={'#fff'}>
    <Flex
      flexDirection={'column'}
        gap={20}
        bgColor={'#fff'}
      width={954}
        margin={'auto auto'}
        padding={'145px 20px 80px'}
      sx={{
        [smMedia]: {
          width: 'calc(100% - 20px)',
          padding: '105px 20px 40px',
        },
      }}
    >
      <H1>DCellar Terms of Use</H1>
      <Content>
        The following terms and conditions govern all use of the dcellar.io and testnet.dcellar.io
        website and all content, services and products available at or through the website. The
        Website is owned and operated by NodeReal. The Website is offered subject to your acceptance
        without modification of all of the terms and conditions contained herein and all other
        operating rules, policies and procedures that may be published from time to time on this
        Site by NodeReal.
      </Content>
      <Content>
        Please read this Agreement carefully before accessing or using the Website. By accessing or
        using any part of the web site, you agree to become bound by the terms and conditions of
        this agreement. If you do not agree to all the terms and conditions of this agreement, then
        you may not access the Website or use any services. If these terms and conditions are
        considered an offer by NodeReal, acceptance is expressly limited to these terms. The Website
        is available only to individuals who are at least 13 years old.
      </Content>
      <H2>Usage Restrictions</H2>
      <Content>
        Customer shall not (a) reverse engineer, copy, modify, adapt, hack the Storage Services, or
        otherwise attempt to gain unauthorized access to the Storage Services or related systems or
        networks; (b) without authorization, access the Storage Services, the Documentation, or
        Company’s Confidential Information to build a competitive product or Storage Services; (c)
        alter or remove, or permit any third party to alter or remove, any proprietary trademark or
        copyright markings incorporated in, marked on, or affixed to the Storage Services; (d)
        access or use the Storage Services: (i) to store infringing, obscene, threatening, or
        otherwise unlawful material, including material violative of third-party privacy rights;
        (ii) in violation of applicable laws; (iii) to store material knowingly or intentionally
        containing software viruses, worms, Trojan horses, or other harmful computer code, files, or
        scripts; or, (iv) in a manner that interferes with or disrupts the integrity or performance
        of the Storage Services or Storage Materials of any other user of the Storage Services; or,
        (e) register for more than one Account per Satellite.
      </Content>
      <H2>Sensitive/Personal Information</H2>
      <Content>
        You agree that, without entering into a separate agreement, you shall not use the Storage
        Services to send or store personal information subject to special regulatory or contractual
        handling requirements (e.g., Payment Card Industry Data Security Standards, the
        Gramm-Leach-Bliley Act, the Health Insurance Portability and Accountability Act, and/or any
        other data protection laws) including without limitation: credit card information, credit
        card numbers and magnetic stripe information, social security numbers, driver’s license
        numbers, passport numbers, government-issued identification numbers, health-related
        information, biometric data, financial account information, personally identifiable
        information collected from children under the age of 13 or from online services directed
        toward children, and real time geo-location data which can identify an individual, or
        information deemed “sensitive” under applicable law (such as racial or ethnic origin,
        political opinions, or religious or philosophical beliefs).
      </Content>
      <H2>Derived Data</H2>
      <Content>
        Except for software subject to the Open Source License, and except for any rights expressly
        granted under this Agreement, Company and its licensors own and shall retain all right,
        title, and interest in and to the Storage Services (including any improvements,
        enhancements, customizations, and modifications thereto), the Documentation, Company
        Confidential Information, and the Derived Data, including, without limitation, all related
        intellectual property rights therein. For purposes hereof, the term “Derived Data” means
        data derived from operation of the Uplink and of the Storage Services via the Uplink, and
        any data that is aggregated by Company (including aggregations with data sourced from other
        Customers and other third-party data sources), and data and information regarding Customers’
        access to and participation in the Storage Services, including, without limitation,
        statistical usage data derived from the use of the Storage Services and configurations, log
        data, and the performance results related thereto. For the avoidance of doubt, nothing
        herein shall be construed as prohibiting Company from utilizing Derived Data to optimize and
        improve the Storage Services or otherwise operate Company’s business; provided that if
        Company provides Derived Data to third parties, such Derived Data shall be de-identified and
        presented in the aggregate so that it will not disclose the identity of Customer to any
        third party. No rights are granted to Customer hereunder other than as expressly set forth
        in this Agreement.
      </Content>
      <H2>Right to Suspend or Terminate</H2>
      <Content>
        With or without notice, Company immediately may suspend or terminate the Account of any
        Customer or Customer’s End User who: (a) violates this Agreement; (b) uses the Storage
        Services in a manner that Company reasonably believes may cause a security risk, a
        disruption to others’ use of the Storage Services, or liability for Company; or, (c) is the
        subject of one or more reports of violation of the Usage Restrictions. Upon suspension,
        Company reserves the right to restrict access to the Storage Services on Customer’s Account
        indefinitely and until such time as Company determines in its sole discretion whether to
        restore or terminate the suspended account.
      </Content>
      <H2>Backup</H2>
      <Content>
        Company does not guarantee the maintenance of any Storage Materials and is not responsible
        for any loss, misuse, or deletion of Storage Materials or any failure of any Storage
        Materials to be stored or encrypted. You, solely, are responsible for backing up and
        maintaining copies of the Storage Materials.
      </Content>
      <H2>Security</H2>
      <Content>
        You are responsible for properly configuring and using the Storage Services to store your
        Storage Materials and for maintaining appropriate security of your Storage Materials.
      </Content>
      <H2>Compliance with Laws</H2>
      <Content>
        You, solely, are responsible for ensuring that storage of your Storage Materials via the
        Storage Services is in compliance with all applicable laws.  We make no representations or
        warranties regarding the suitability of the Storage Services for the storage of any
        particular types of data or for your specific usage.  Company makes no representation or
        warranty that using the Storage Services to store any Storage Materials that include
        personal data or sensitive data requiring heightened security protections complies with any
        specific regulations or laws, including without limitation (i) “protected health
        information,” as defined under the Health Insurance Portability and Accountability Act
        (“HIPAA”), (ii) “cardholder data,” as defined by the Payment Card Industry Data Security
        Standard (“PCI DSS”), or (iii) “Sensitive Personal Data” as defined under the General Data
        Protection Regulation, Regulation (EU) 2016/679 (“GDPR”), and other applicable law.  You
        must provide all notices to, and obtain any necessary consents from, third parties as
        required by applicable law in connection with the storage of Storage Materials via the
        Storage Services.  We reserve the right at any time, without notice, to remove, reject, or
        delete any Storage Materials that contain unencrypted and/or plain text data, or that
        otherwise violate this Agreement.
      </Content>
      <H2>DISCLAIMER OF WARRANTIES AND LIMITATION OF LIABILITY</H2>
      <Content>
        THE NODEREAL SITE AND ALL INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING ANY SOFTWARE)
        AND SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THIS SITE ARE PROVIDED
        BY NODEREAL ON AN “AS IS” AND “AS AVAILABLE” BASIS, UNLESS OTHERWISE SPECIFIED IN THE
        AGREEMENT. NODEREAL MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        AS TO THE OPERATION OF THIS SITE OR THE INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING
        ANY SOFTWARE) OR SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE
        NODEREAL SITE, UNLESS OTHERWISE SPECIFIED IN WRITING. YOU EXPRESSLY AGREE THAT YOUR USE OF
        THIS SITE IS AT YOUR SOLE RISK. TO THE FULL EXTENT PERMISSIBLE BY APPLICABLE LAW, NODEREAL
        DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED
        WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. NODEREAL DOES NOT
        WARRANT THAT THIS SITE; INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING ANY SOFTWARE)
        OR SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE NODEREAL SITE; ITS
        SERVERS; OR E-MAIL SENT FROM NODEREAL ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        NODEREAL WILL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF THE NODEREAL
        SITE OR FROM ANY INFORMATION, CONTENT, MATERIALS, PRODUCTS (INCLUDING SOFTWARE) OR SERVICES
        INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE NODEREAL SITE, INCLUDING, BUT NOT
        LIMITED TO DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, AND CONSEQUENTIAL DAMAGES, UNLESS
        OTHERWISE SPECIFIED IN THE AGREEMENT. CERTAIN STATE LNODEREAL DO NOT ALLOW LIMITATIONS ON
        IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LNODEREAL
        APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS, EXCLUSIONS, OR LIMITATIONS MAY NOT APPLY
        TO YOU, AND YOU MIGHT HAVE ADDITIONAL RIGHTS.
      </Content>
      </Flex>
      </Box>
  );
};

TermsOfUsePage.getLayout = (page: ReactElement) => {
  return <LandingPage page={page} />;
};
