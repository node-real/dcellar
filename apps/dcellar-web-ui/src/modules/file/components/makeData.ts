import { ChainVisibilityEnum } from "../type";

const range = (len: number) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const generateNewFile = (index: number): any => {
  return {
    // fake data
    Owner: '0xD7B568Ca056F46Ce23C8bddCcB98Ac8CeAe18Ff6',
    BucketName: 'fake_user',
    ObjectName: 'fake.png',
    Id: '794',
    PayloadSize: '997',
    Visibility: ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ,
    ContentType: 'image/png',
    CreateAt: '1681290627',
    ObjectStatus: 1,
    RedundancyType: 0,
    SourceType: 0,
    checksums: [
      'tQ1U22QwYx9+PC6l3zboALQsj9HL5Ax639+qe2DgnHw=',
      '0rEAKTmM7s+oI/JFQNMXaazlwfupc5c2W+D1qjs6M+g=',
      '/oUxmTAJPRC1BQv+SpmELJleGydC4dKG9wGJoDCtYl0=',
      'Iah1+UJudoAs1VEYvImGOOi09JHfIRPTI2ZMpNuGyP4=',
      'RRfECwS/ctfocFt7ytUl29uJIONdOpPjED+w3y+KDEY=',
      '16yh7tSsR0lIQOfNJOGvHeuQ0mQJPItnYdXZboRhcS0=',
      'HCNA1m9c01XNoB0MwWfyZMN/xT3v56wBdUTO83ya6r0=',
    ],
    secondary_sp_addresses: [
      '0x33b22C9d21670f001fA430fe9f35239123978e79',
      '0xd8283E74d729B428712C2d393632Fc527B0F39CF',
      '0x216B1EA22422F930E4A157d6f38F7b12206c2A39',
      '0x14361bB0E7f1A4d656588F08dC56836C9Feb2454',
      '0xEE380501A7fAA03CadBDF981B865064F824bC3EC',
      '0xdc5dFFfa5Fc0Addf4A3c32F8DB6F39E1554ecbcf',
    ],
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): any[] => {
    const len = lens[depth]!;
    return range(len).map((d): any => {
      return {
        ...generateNewFile(d),
      };
    });
  };

  return makeDataLevel();
}
