// import Sentry from 'modules/sentry';

// https://app.clickup.com/t/3t983k3 Temp close collect control
export const startGaReport = (_GaId: string) => {
  // (window as any)[`ga-disable-${GaId}`] = false;
  // (window as any).gtag('js', new Date());
  // (window as any).gtag('config', GaId);
};

export const forbidGaReport = (_GaId: string) => {
  // (window as any)[`ga-disable-${GaId}`] = true;
};

export const startStReport = () => {
  // Sentry.getCurrentHub().getClient().getOptions().enabled = true;
};

export const forbidStReport = () => {
  // Sentry.getCurrentHub().getClient().getOptions().enabled = false;
};
