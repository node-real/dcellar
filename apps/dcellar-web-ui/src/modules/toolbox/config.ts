export enum ToolTypeEnum {
  DevTool = 'dev-tool',
  SDK = 'SDK',
  API = 'API',
}
export const badgeTexts = {
  [ToolTypeEnum.DevTool]: 'Developer Tool',
  [ToolTypeEnum.SDK]: 'SDK',
  [ToolTypeEnum.API]: 'API',
};
export type ToolItem = {
  icon: string;
  title: string;
  type: ToolTypeEnum;
  badge: string;
  links: {
    icon: string;
    name: string;
    url: string;
  }[];
  desc: string;
};

export const toolList = [
  {
    icon: 'source-code',
    title: 'DCellar Open Source',
    type: ToolTypeEnum.DevTool,
    badge: badgeTexts[ToolTypeEnum.DevTool],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/node-real/dcellar',
      },
    ],
    desc: 'Utilize DCellar open-source codebase and encourage collaboration to improve and extend its functionality.',
  },
  {
    icon: 'upload',
    title: 'Greenfield UploadKit',
    type: ToolTypeEnum.DevTool,
    badge: badgeTexts[ToolTypeEnum.DevTool],
    links: [
      {
        icon: 'line-github',
        name: 'Github',
        url: 'https://github.com/node-real/greenfield-toolkit/tree/main/packages/uploadkit',
      },
      {
        icon: 'doc',
        name: 'Docs',
        url: 'https://node-real.github.io/greenfield-toolkit',
      },
      {
        icon: 'npm',
        name: 'npm',
        url: 'https://www.npmjs.com/package/@node-real/greenfield-uploadkit',
      },
    ],
    desc: 'Greenfield Upload UIKit is offered by NodeReal, it&apos;s fully open sourced, developers can easily integrate into their WebUI dApps.',
  },
  {
    icon: 'golang',
    title: 'Greenfield Go SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-go-sdk',
      },
    ],
    desc: 'Go sdk for Greenfield',
  },
  {
    icon: 'cosmos',
    title: 'Greenfield Cosmos SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-cosmos-sdk',
      },
    ],
    desc: 'A cosmos-sdk fork for greenfield',
  },
  {
    icon: 'javascript',
    title: 'Greenfield JavaScript SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-js-sdk',
      },
    ],
    desc: 'JS SDK for Greenfield',
  },
  {
    icon: 'source-code',
    title: 'Greenfield Bundle SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-bundle-sdk',
      },
    ],
    desc: 'Go SDK for Greenfield bundle',
  },
  {
    icon: 'source-code',
    title: 'Greenfield Contracts SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-contracts-sdk',
      },
    ],
    desc: 'A library of smart contracts for the Greenfield',
  },
  {
    icon: 'python',
    title: 'Greenfield Python SDK',
    type: ToolTypeEnum.SDK,
    badge: badgeTexts[ToolTypeEnum.SDK],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-python-sdk',
      },
    ],
    desc: 'Python sdk for Greenfield',
  },
  {
    icon: 'terminal',
    title: 'Greenfield CMD',
    type: ToolTypeEnum.DevTool,
    badge: badgeTexts[ToolTypeEnum.DevTool],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://github.com/bnb-chain/greenfield-cmd',
      },
    ],
    desc: 'Support CMD Tool for Greenfield',
  },
  {
    icon: 'nodereal',
    title: 'Greenfield Mainnet Billing API',
    type: ToolTypeEnum.API,
    badge: badgeTexts[ToolTypeEnum.API],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://nodereal.io/api-marketplace/bnb-greenfield-mainnet-billing-api',
      },
    ],
    desc: 'This API package can help you get billing info instantly in BNB Greenfield Mainnet.',
  },
  {
    icon: 'nodereal',
    title: 'Greenfield Mainnet Enhanced API',
    type: ToolTypeEnum.API,
    badge: badgeTexts[ToolTypeEnum.API],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://nodereal.io/api-marketplace/bnb-greenfield-mainnet-enhanced-api',
      },
    ],
    desc: 'This API package can help you get transactions, objects, buckets, and account info in Greenfield.',
  },
  {
    icon: 'nodereal',
    title: 'Greenfield Testnet Billing API',
    type: ToolTypeEnum.API,
    badge: badgeTexts[ToolTypeEnum.API],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://nodereal.io/api-marketplace/bnb-greenfield-testnet-billing-api',
      },
    ],
    desc: 'This API package can help you get billing info instantly in BNB Greenfield Testnet.',
  },
  {
    icon: 'nodereal',
    title: 'Greenfield Testnet Enhanced API',
    type: ToolTypeEnum.API,
    badge: badgeTexts[ToolTypeEnum.API],
    links: [
      {
        icon: 'link',
        name: 'Link',
        url: 'https://nodereal.io/api-marketplace/bnb-greenfield-testnet-enhanced-api',
      },
    ],
    desc: 'This API package can help you get transactions, objects, buckets, and account info in Greenfield.',
  },
];
