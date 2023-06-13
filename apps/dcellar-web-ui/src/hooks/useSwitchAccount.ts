import { useEffect } from 'react';
import { Connector, ConnectorData } from 'wagmi';

type HandleConnectUpdate = (params: ConnectorData) => void;

export const useSwitchAccount = (
  connector: Connector | undefined,
  handleConnectorUpdate: HandleConnectUpdate,
) => {
  useEffect(() => {
    if (!connector) return;

    connector.on('change', handleConnectorUpdate);

    return () => {
      connector.off('change', handleConnectorUpdate);
    };
  }, [connector, handleConnectorUpdate]);
};
