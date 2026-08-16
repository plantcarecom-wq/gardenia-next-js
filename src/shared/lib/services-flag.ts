import { NextResponse } from 'next/server';

export function isServicesModuleEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SERVICES_MODULE_ENABLED === 'true';
}

export function requireServicesModule() {
  if (!isServicesModuleEnabled()) {
    return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 });
  }
  return null;
}
