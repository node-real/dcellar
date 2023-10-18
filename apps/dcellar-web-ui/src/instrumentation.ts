import { runtimeEnv } from '@/base/env';
import { PropertiesConfig } from 'apollo-node-client';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ConfigService } = await import('apollo-node-client');
    // https://apollo.bk.nodereal.cc/ https://apollo.nodereal.link/
    const service = new ConfigService({
      appId: 'dcellar-ui',
      configServerUrl:
        process.env.NODE_ENV === 'development'
          ? 'https://apollo-config.bk.nodereal.cc'
          : 'http://configcenter-apollo-configservice.configcenter.svc.cluster.local:8080',
    });

    const config = (await service.getConfig(
      ['development', 'qa'].includes(runtimeEnv)  ? 'devnet' : runtimeEnv,
    )) as PropertiesConfig;
    (global as any).__GLOBAL_CONFIG = Object.fromEntries(config.getAllConfig());
    config.addChangeListener(() => {
      (global as any).__GLOBAL_CONFIG = Object.fromEntries(config.getAllConfig());
    });
  }
}
