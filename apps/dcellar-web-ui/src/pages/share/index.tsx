import { NextPage, NextPageContext } from 'next';
import { last } from 'lodash-es';
import { decodeObjectName } from '@/utils/string';
import React, { ReactNode, useState } from 'react';
import { ObjectInfo } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { IQuotaProps } from '@bnb-chain/greenfield-chain-sdk/dist/esm/types/storage';
import { useAsyncEffect } from 'ahooks';
import Head from 'next/head';
import { Box, Flex } from '@totejs/uikit';
import { Logo } from '@/components/layout/Logo';
import { ShareError } from '@/modules/share/ShareError';
import { SharedFile } from '@/modules/share/SharedFile';
import { Footer } from '@/components/layout/Footer';
import { ShareCTA } from '@/modules/share/ShareCTA';
import styled from '@emotion/styled';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { E_NOT_FOUND, E_PERMISSION_DENIED, E_UNKNOWN } from '@/facade/error';
import { ShareLogin } from '@/modules/share/ShareLogin';
import { Header } from '@/components/layout/Header';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Loading } from '@/components/common/Loading';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { getSpUrlByBucketName } from '@/facade/virtual-group';
import { headObject } from '@/facade/object';

const Container = styled.main`
  min-height: calc(100vh - 48px);
  max-height: max-content;
  display: grid;
`;

interface PageProps {
  objectName: string;
  fileName: string;
  bucketName: string;
}

const SharePage: NextPage<PageProps> = (props) => {
  const { oneSp } = useAppSelector((root) => root.sp);
  const isMounted = useIsMounted();
  const [objectInfo, setObjectInfo] = useState<ObjectInfo | null>();
  const [quotaData, setQuotaData] = useState<IQuotaProps | null>();
  const { objectName, fileName, bucketName } = props;
  const title = `${bucketName} - ${fileName}`;
  const { loginAccount } = useAppSelector((root) => root.persist);
  const dispatch = useAppDispatch();

  useAsyncEffect(async () => {
    if (!oneSp) return;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, oneSp));
    const [primarySpEndpoint, error] = await getSpUrlByBucketName(bucketName);
    if (!primarySpEndpoint) {
      // bucket not exist
      setObjectInfo(null);
      setQuotaData(null);
      return;
    }
    const params = {
      bucketName,
      objectName,
      endpoint: primarySpEndpoint,
      seedString,
      address: loginAccount,
    }
    if (!loginAccount || !isOwner) {
      const objectInfo = await headObject(bucketName, objectName);
      setObjectInfo(objectInfo);
      setQuotaData({} as IQuotaProps);
      return;
    }

    const [objectInfo, quotaData] = await getObjectInfoAndBucketQuota(params);
    setObjectInfo(objectInfo);
    setQuotaData(quotaData);
  }, [oneSp]);

  const isPrivate = objectInfo?.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE;
  const walletConnected = !!loginAccount;
  const isOwner = objectInfo?.owner === loginAccount;

  const header = (
    <Head>
      <title>{title}</title>
    </Head>
  );

  if (!isMounted) return header;
  return (
    <>
      {header}
      <Flex>
        <Box flex={1}>
          <Container>
            {walletConnected && <Header taskManagement={false} />}
            {!isPrivate && !walletConnected && (
              <Logo
                zIndex={1}
                href="/buckets"
                margin="20px 24px"
                position="absolute"
                left={0}
                top={0}
              />
            )}
            {quotaData === undefined || objectInfo === undefined ? (
              <Loading />
            ) : objectInfo === null || quotaData === null ? (
              <ShareError type={!objectInfo ? E_NOT_FOUND : E_UNKNOWN} />
            ) : isPrivate && !walletConnected ? (
              <ShareLogin />
            ) : (
              <>
                {isPrivate && !isOwner ? (
                  <ShareError type={E_PERMISSION_DENIED} />
                ) : (
                  <SharedFile
                    loginAccount={loginAccount as string}
                    objectInfo={objectInfo}
                    quotaData={quotaData}
                    fileName={fileName}
                  />
                )}
              </>
            )}
          </Container>
          <Footer />
        </Box>
        {!walletConnected && <ShareCTA />}
      </Flex>
    </>
  );
};

// ref https://github.com/kirill-konshin/next-redux-wrapper/issues/545
SharePage.getInitialProps = async (context: NextPageContext) => {
  const { query, res } = context;
  const { file } = query;

  const redirect = () => {
    res!.statusCode = 302;
    res!.setHeader('location', '/buckets');
    return { bucketName: '', fileName: '', objectName: '' };
  };

  if (!file) return redirect();

  const [bucketName, ...path] = decodeObjectName(Array<string>().concat(file)[0]).split('/');
  const objectName = path.join('/');
  const fileName = last(path);

  if (!fileName) return redirect();

  return { bucketName, fileName, objectName };
};

(SharePage as any).getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};

export default SharePage;
