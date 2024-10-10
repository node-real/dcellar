import { IconFont } from '@/components/IconFont';
import { Header } from '@/components/layout/Header';
import { Nav } from '@/components/layout/Nav';
import { useAppDispatch, useAppSelector } from '@/store';
import { EStreamRecordStatus, selectAccount } from '@/store/slices/accounts';
import { setObjectOperation } from '@/store/slices/object';
import styled from '@emotion/styled';
import { Flex, Grid } from '@node-real/uikit';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { PropsWithChildren, memo, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

const GREY_BG = ['/wallet'];

interface LayoutProps extends PropsWithChildren {}

export const Layout = memo<LayoutProps>(function Layout({ children }) {
  const dispatch = useAppDispatch();
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const isBucketMigrating = useAppSelector((root) => root.bucket.isBucketMigrating);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const GLOBAL_NOTIFICATION = useAppSelector((root) => root.apollo.GLOBAL_NOTIFICATION);
  const GLOBAL_NOTIFICATION_ETA = useAppSelector((root) => root.apollo.GLOBAL_NOTIFICATION_ETA);

  const { pathname } = useRouter();
  const [showNotification, setShowNotification] = useState(() => {
    return (
      (!!GLOBAL_NOTIFICATION && !GLOBAL_NOTIFICATION_ETA) ||
      (!!GLOBAL_NOTIFICATION &&
        GLOBAL_NOTIFICATION_ETA &&
        Number(GLOBAL_NOTIFICATION_ETA) > Date.now())
    );
  });

  const bucket = bucketRecords[currentBucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));
  const folderExist = !objectCommonPrefix ? true : !!objectRecords[completeCommonPrefix + '/'];

  const [_, drop] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop() {
      return false;
    },
    hover() {
      if (pathname !== '/buckets/[...path]') return;
      if (
        isBucketDiscontinue ||
        isBucketMigrating ||
        !isBucketOwner ||
        accountDetail.status === EStreamRecordStatus.FROZEN ||
        !folderExist
      )
        return;
      dispatch(setObjectOperation({ operation: ['', 'upload'] }));
    },
  });

  useEffect(() => {
    if (!GLOBAL_NOTIFICATION_ETA) return;
    const offset = Number(GLOBAL_NOTIFICATION_ETA) - Date.now();
    if (offset <= 0) {
      setShowNotification(false);
      return;
    }
    setTimeout(() => setShowNotification(false), offset);
  }, [GLOBAL_NOTIFICATION_ETA]);

  return (
    <LayoutContainer>
      <LayoutHeader>
        <Header />
      </LayoutHeader>
      <LayoutNav>
        <Nav />
      </LayoutNav>
      <Content
        id={'layout-main'}
        ref={drop}
        className={cn({ 'layout-grey': GREY_BG.includes(pathname) })}
      >
        {showNotification && (
          <Notification>
            <IconFont type={'colored-error2'} w={'16'} />
            {GLOBAL_NOTIFICATION}
          </Notification>
        )}
        {children}
      </Content>
    </LayoutContainer>
  );
});

const Notification = styled(Flex)`
  color: #ca300e;
  font-size: 14px;
  gap: 8px;
  border-radius: 4px;
  background-color: rgba(238, 57, 17, 0.1);
  padding: 8px 12px;
  margin-bottom: 16px;
`;

const LayoutContainer = styled(Grid)`
  grid-template-areas:
    'Header Header'
    'Nav Content';
  grid-template-columns: auto 1fr;
`;

const LayoutHeader = styled.header`
  grid-area: Header;
  position: sticky;
  top: 0;
  max-width: 100%;
  z-index: 1001;
  height: 65px;
  background: var(--ui-colors-bg-middle);
`;

const LayoutNav = styled.nav`
  grid-area: Nav;
  position: sticky;
  top: 65px;
  overflow-y: auto;
  height: calc(100vh - 65px);
  width: 237px;
  background: #ffffff;

  :after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 1px;
    background: var(--ui-colors-readable-border);
  }
`;

const Content = styled.main`
  grid-area: Content;
  background: var(--ui-colors-bg-middle);
  padding: 24px;
  position: relative;
  z-index: 1;
  min-width: 763px;

  &.layout-grey {
    background: var(--ui-colors-bg-bottom);
  }
`;
