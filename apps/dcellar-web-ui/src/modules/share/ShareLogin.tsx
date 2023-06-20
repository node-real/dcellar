import styled from '@emotion/styled';
import { Image, Text } from '@totejs/uikit';
import Welcome from '@/components/welcome';
import { assetPrefix } from '@/base/env';
import { css } from '@emotion/react';
import { useMount } from 'ahooks';
import { reportEvent } from '@/utils/reportEvent';

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
      <Image w={242} src={`${assetPrefix}/images/icons/logo.svg`} alt="Dcellar" />
      <Text mt={48} mb={4} fontSize={24} fontWeight={600}>
        Connect wallet to view files in DCellar.
      </Text>
      <Welcome buttonOnly ga="dc.shared_ui.login.connect_wa.click" />
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
