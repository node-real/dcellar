import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Text } from '@node-real/uikit';
import { useMount } from 'ahooks';

import { assetPrefix } from '@/base/env';
import { ConnectWallet } from '@/components/ConnectWallet';
import { IconFont } from '@/components/IconFont';
import { reportEvent } from '@/utils/gtag';

export const ShareLogin = () => {
  useMount(() => {
    reportEvent({ name: 'dc.share_ui.login.all.pv' });
  });

  return (
    <Content>
      <Cube1 />
      <Cube2 />
      <Cube3 />
      <Cube4 />
      <IconFont type={'logo-new'} w={242} h={45} />
      <Text mt={48} mb={4} fontSize={24} fontWeight={600}>
        Connect wallet to view objects in DCellar.
      </Text>
      <ConnectWallet mt={53} />
    </Content>
  );
};

const Content = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Cube = css`
  position: absolute;
  pointer-events: none;
`;

const Cube1 = styled.div`
  ${Cube};
  width: 120px;
  height: 120px;
  background: url(${assetPrefix}/images/share/cub1.svg) center/contain no-repeat;
  transform: translate(-444px, -202px);
`;
const Cube2 = styled.div`
  ${Cube};
  width: 92px;
  height: 88px;
  background: url(${assetPrefix}/images/share/cub2.svg) center/contain no-repeat;
  transform: translate(446px, -230px);
`;
const Cube3 = styled.div`
  ${Cube};
  width: 88px;
  height: 93px;
  background: url(${assetPrefix}/images/share/cub3.svg) center/contain no-repeat;
  transform: translate(-357px, 317px);
`;
const Cube4 = styled.div`
  ${Cube};
  width: 51px;
  height: 46px;
  background: url(${assetPrefix}/images/share/cub4.svg) center/contain no-repeat;
  transform: translate(337px, 397px);
`;
