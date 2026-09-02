import { NextResponse } from 'next/server';
import { isServicesModuleEnabled } from '@/config/feature-flags';

// Re-exported so existing importers keep working — but this MUST be the
// server-only SERVICES_MODULE_ENABLED flag, not the NEXT_PUBLIC_ client
// mirror. This file previously read the public var directly, which meant
// every API route's hidden-module gate (`requireServicesModule`, used by
// ~30 routes) was actually trusting a client-exposed env var instead of the
// true server secret — harmless as long as an operator keeps both vars in
// sync, but wrong as a trust boundary, and silently wrong if they ever
// drift (config/feature-flags.ts's checkClientServerFlagMatch only warns).
export { isServicesModuleEnabled };

export function requireServicesModule() {
  if (!isServicesModuleEnabled()) {
    return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
  }
  return null;
}
