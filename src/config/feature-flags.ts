import { env } from './env';

export const isServicesModuleEnabled = (): boolean => {
  return env.SERVICES_MODULE_ENABLED === 'true';
};

// Client components can't see non-NEXT_PUBLIC_ env vars at runtime (only
// NEXT_PUBLIC_-prefixed vars are inlined into the browser bundle), so this
// reads the public mirror directly rather than going through `env`.
export const isServicesModuleEnabledClient = (): boolean => {
  return process.env.NEXT_PUBLIC_SERVICES_MODULE_ENABLED === 'true';
};

export const checkClientServerFlagMatch = () => {
  if (typeof window === 'undefined') {
    // Only run on server
    const serverFlag = env.SERVICES_MODULE_ENABLED === 'true';
    const clientFlag = env.NEXT_PUBLIC_SERVICES_MODULE_ENABLED === 'true';
    if (serverFlag !== clientFlag) {
      console.warn(
        `⚠️ WARNING: SERVICES_MODULE_ENABLED (${serverFlag}) does not match NEXT_PUBLIC_SERVICES_MODULE_ENABLED (${clientFlag}). UI state and API availability may diverge.`
      );
    }
  }
};
