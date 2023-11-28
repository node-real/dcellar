export const OWNER_ACCOUNT_NAME = 'Owner Account';

export const EVENT_CROSS_TRANSFER_IN = 'greenfield.bridge.EventCrossTransferIn';

export const TX_TYPE_MAP: Record<string, string> = {
  [EVENT_CROSS_TRANSFER_IN]: 'Transfer In',
  'cosmos.gov.v1.MsgDeposit': 'Proposal Deposit',
};

export const CHAIN_NAMES: { [key: number | string]: string } = {
  56: 'BNB Smart Chain Mainnet',
  97: 'BNB Smart Chain Testnet',
  9000: 'BNB Greenfield Devnet',
  5600: 'BNB Greenfield Testnet',
  1017: 'BNB Greenfield Mainnet',
};
