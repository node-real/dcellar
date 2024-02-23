import { VisibilityType } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import {
  BucketInfo,
  ObjectInfo,
} from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { IQuotaProps, PermissionTypes } from '@bnb-chain/greenfield-js-sdk';
import styled from '@emotion/styled';
import { Box, Flex, Grid } from '@node-real/uikit';
import { useAsyncEffect } from 'ahooks';
import { last, trimEnd } from 'lodash-es';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import { ReactNode, useState } from 'react';

import { runtimeEnv } from '@/base/env';
import { Loading } from '@/components/common/Loading';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Logo } from '@/components/layout/Logo';
import { headBucket } from '@/facade/bucket';
import { getObjectInfoAndBucketQuota } from '@/facade/common';
import { E_NOT_FOUND, E_PERMISSION_DENIED, E_UNKNOWN } from '@/facade/error';
import { hasObjectPermission, headObject } from '@/facade/object';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useLogin } from '@/hooks/useLogin';
import { ShareCTA } from '@/modules/share/ShareCTA';
import { SharedFile } from '@/modules/share/SharedFile';
import { ShareError } from '@/modules/share/ShareError';
import { ShareFolder } from '@/modules/share/ShareFolder';
import { ShareLogin } from '@/modules/share/ShareLogin';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { SpItem, getPrimarySpInfo } from '@/store/slices/sp';
import { networkTag } from '@/utils/common';
import { decodeObjectName } from '@/utils/string';

const Container = styled.main`
  min-height: calc(100vh - 48px);
  max-height: max-content;
  display: grid;
  grid-template-areas:
    'Header'
    'Content';
  grid-template-rows: 65px 1fr;
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
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>();
  const { objectName, fileName, bucketName } = props;
  const title = `${bucketName}${fileName ? `- ${fileName}` : ''}`;
  const { loginAccount } = useAppSelector((root) => root.persist);
  const dispatch = useAppDispatch();
  const [getPermission, setGetPermission] = useState(true);
  const [primarySp, setPrimarySp] = useState<SpItem>({} as SpItem);
  const { logout } = useLogin();
  const isFolder = objectName.endsWith('/') || objectName === '';

  const isPrivate = objectInfo?.visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE || isFolder;
  const walletConnected = !!loginAccount;
  const isOwner = objectInfo?.owner === loginAccount;

  useAsyncEffect(async () => {
    if (!oneSp) return;
    const { seedString } = await dispatch(getSpOffChainData(loginAccount, oneSp));
    const bucketInfo = await headBucket(bucketName);
    if (!bucketInfo) {
      // bucket not exist
      setObjectInfo(null);
      setQuotaData(null);
      setBucketInfo(null);
      return;
    }
    const sp = await dispatch(getPrimarySpInfo(bucketName, +bucketInfo.globalVirtualGroupFamilyId));

    setBucketInfo(bucketInfo);
    if (!sp) {
      setObjectInfo(null);
      setQuotaData(null);
      return;
    }
    setPrimarySp(sp);

    if (!objectName) {
      setObjectInfo(null);
      setQuotaData(null);
      return;
    }

    const params = {
      bucketName,
      objectName,
      endpoint: sp.endpoint,
      seedString,
      address: loginAccount,
    };

    if (!loginAccount) {
      const objectInfo = await headObject(bucketName, objectName);
      setObjectInfo(objectInfo);
      setQuotaData({} as IQuotaProps);
      return;
    }

    const [objectInfo, quotaData, error] = await getObjectInfoAndBucketQuota(params);
    if (
      ['bad signature', 'invalid signature', 'user public key is expired'].includes(error || '')
    ) {
      logout(true);
    }
    setObjectInfo(objectInfo);
    setQuotaData(quotaData || ({} as IQuotaProps));
  }, [oneSp, walletConnected]);

  useAsyncEffect(async () => {
    if (!loginAccount || !bucketName) return;
    const res = await hasObjectPermission(
      bucketName,
      objectName,
      PermissionTypes.ActionType.ACTION_GET_OBJECT,
      loginAccount,
    );
    setGetPermission(res.effect === PermissionTypes.Effect.EFFECT_ALLOW);
  }, [bucketName, objectName, loginAccount]);

  const header = (
    <Head>
      <title>
        {title}
        {networkTag(runtimeEnv)}
      </title>
    </Head>
  );

  if (!isMounted) return header;

  // todo refactor
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
                href="/"
                target="_blank"
                margin="20px 24px"
                position="absolute"
                left={0}
                top={0}
              />
            )}
            <Grid gridArea="Content" placeItems="center">
              {quotaData === undefined || objectInfo === undefined ? (
                <Loading />
              ) : isPrivate && !walletConnected ? (
                <ShareLogin />
              ) : ((objectInfo === null || quotaData === null) && objectName) ||
                (!objectName && bucketInfo === null) ? (
                <ShareError type={!objectInfo ? E_NOT_FOUND : E_UNKNOWN} />
              ) : (
                <>
                  {isPrivate && !isOwner && !getPermission ? (
                    <ShareError type={E_PERMISSION_DENIED} />
                  ) : isFolder || !objectName ? (
                    <ShareFolder
                      primarySp={primarySp}
                      loginAccount={loginAccount as string}
                      quotaData={quotaData!}
                      fileName={fileName}
                    />
                  ) : (
                    <SharedFile
                      primarySp={primarySp}
                      loginAccount={loginAccount as string}
                      objectInfo={objectInfo!}
                      quotaData={quotaData!}
                      fileName={fileName}
                    />
                  )}
                </>
              )}
            </Grid>
          </Container>
          <Footer />
        </Box>
        {(!walletConnected || isFolder) && <ShareCTA />}
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
  const fileName = !objectName ? '' : last(trimEnd(objectName, '/').split('/')) || '';

  return { bucketName, fileName, objectName };
};

(SharePage as any).getLayout = function getLayout(page: ReactNode) {
  return <>{page}</>;
};

export default SharePage;
