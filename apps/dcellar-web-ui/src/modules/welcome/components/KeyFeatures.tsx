import { useMediaQuery } from '@totejs/uikit';
import { assetPrefix } from '@/base/env';
import { KeyFeaturesMobile } from './KeyFeaturesMobile';
import { KeyFeaturesPC } from './KeyFeaturesPC';

export type TFeatureItem = {
  label: string;
  title: string;
  desc: string;
  tag?: string;
  introImg: string;
  introImgSm: string;
  gaClickName: string;
};
export const keyFeatureList: TFeatureItem[] = [
  {
    label: 'Storage Management',
    title: 'Visualized Storage Management',
    desc: "DCellar's visual storage management feature enables you to easily store, download, share and perform batch operations on objects.",
    introImg: `${assetPrefix}/images/welcome/storage.png`,
    introImgSm: `${assetPrefix}/images/welcome/storage_sm.png`,
    gaClickName: 'dc_lp.homepage.key_f.storage.click',
  },
  {
    label: 'Permission Management',
    title: 'Permission Management',
    desc: 'Manage access to the buckets and objects you create, whether for groups or individuals.',
    introImg: `${assetPrefix}/images/welcome/permission.png`,
    introImgSm: `${assetPrefix}/images/welcome/permission_sm.png`,
    gaClickName: 'dc_lp.homepage.key_f.permssion.click',
  },
  {
    label: 'Cross-chain Asset Management',
    title: 'Cross-chain Assets Management',
    desc: 'Cross-chain assets management enables transfer of assets between BNB Greenfield and BNB Smart Chain (BSC).',
    introImg: `${assetPrefix}/images/welcome/cross-chain.png`,
    introImgSm: `${assetPrefix}/images/welcome/cross-chain_sm.png`,
    gaClickName: 'dc_lp.homepage.key_f.assets.click'
  },
  {
    label: 'Accounts Management',
    title: 'Accounts Management',
    desc: 'Users can create multiple payment accounts and have the permission to link buckets to different payment accounts to pay for storage and data package.',
    introImg: `${assetPrefix}/images/welcome/accounts_1.png`,
    introImgSm: `${assetPrefix}/images/welcome/accounts_sm1.png`,
    gaClickName: 'dc_lp.homepage.key_f.accounts.click'
  },
  {
    label: 'Data Dashboard',
    tag: '(coming soon)',
    title: 'Comprehensive Data Dashboard ',
    desc: 'Comprehensive data dashboard displays storage usage, cost usage, and other relevant metrics.',
    introImg: `${assetPrefix}/images/welcome/dashboard.png`,
    introImgSm: `${assetPrefix}/images/welcome/dashboard_sm.png`,
    gaClickName: 'dc_lp.homepage.key_f.dashboard.click'
  },
];

export const KeyFeatures = () => {
  const [isMobile] = useMediaQuery('(max-width: 767px)');
  return isMobile ? <KeyFeaturesMobile /> : <KeyFeaturesPC />;
};
