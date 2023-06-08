export const WalletErrorCode = {
  USER_REJECT: 4001,
  REQUEST_PENDING: -32002,
};

export const ConnectErrorCodeMsgMap = {
  [WalletErrorCode.USER_REJECT]: '',
  [WalletErrorCode.REQUEST_PENDING]: `Oops, connect wallet action is pending, please confirm it in wallet extension that you are using.`,
};

export const SwitchNetworkErrorCodeMsgMap = {
  [WalletErrorCode.USER_REJECT]: '',
  [WalletErrorCode.REQUEST_PENDING]: `Oops, switch network action is pending, please confirm it in wallet extension that you are using.`,
};

// TODO record
// export const ErrorMsgMap = {
//   META_MASK_NOT_INSTALL: `Metamask not installed. Please install and reconnect.`,
//   TRUST_WALLET_NOT_INSTALL: `Trust wallet not installed. Please install and reconnect.`,
//   ANY_WALLET_NOT_INSTALL: `Wallet not installed. Please install and reconnect.`,
//   CONNECT_PENDING: `Oops, connect wallet action is pending, please confirm it in wallet extension that you are using.`,
//   CONNECT_COMMON_ERROR: `Oops, connect wallet met error, please try again.`,

//   ADD_CHAIN_ERROR: `Oops, add network met error, please check it in wallet extension.`,
//   SWITCH_CHAIN_ERROR: `Oops, switch network met error, please check it in wallet extension.`,
//   SWITCH_PENDING: `Oops, switch network action is pending, please confirm it in wallet extension that you are using.`,
//   SWITCH_COMMON_ERROR: `Oops, switch network met error, please try again.`,
// };
