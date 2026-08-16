'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { isServicesModuleEnabledClient } from '@/config/feature-flags';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatPrice } from '@/shared/lib/format-price';
import { KYC_REGIONS, DEFAULT_KYC_REGION, KYC_REGION_LABELS, KycRegion } from '@/shared/lib/kyc';
import { useStore } from '@/shared/store';

type SettingField = {
  key: string;
  label: string;
  suffix?: string;
  step?: string;
};

const CHECKOUT_FIELDS: SettingField[] = [
  { key: 'deliveryFee', label: 'Default Delivery Fee' },
  { key: 'minOrderAmount', label: 'Minimum Order Amount' },
];

const GARDENER_FIELDS: SettingField[] = [
  { key: 'defaultServiceCommissionPercent', label: 'Default Service Commission', suffix: '%', step: '0.1' },
  { key: 'defaultGardenerItemDiscountPercent', label: 'Default Gardener Product Discount', suffix: '%', step: '0.1' },
  { key: 'gardenerResponseSlaMinutes', label: 'Gardener Response SLA', suffix: 'minutes' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { pushToast } = useStore();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [kycRegion, setKycRegion] = useState<KycRegion>(DEFAULT_KYC_REGION);
  const showServices = isServicesModuleEnabledClient();

  useEffect(() => {
    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const map: Record<string, string> = {};
          for (const s of data.data) map[s.key] = String(s.value);
          setValues(map);
          if (map.baseCurrency) setCurrency(map.baseCurrency);
          if (map.kycRegion) setKycRegion(map.kycRegion as KycRegion);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSection = async (sectionKey: string, fields: SettingField[]) => {
    setSavingKey(sectionKey);
    try {
      const results = await Promise.all(
        fields.map((f) =>
          fetch('/api/v1/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: f.key, value: Number(values[f.key] ?? 0) }),
          })
        )
      );
      if (results.every((r) => r.ok)) {
        pushToast({ title: 'Settings saved', variant: 'success' });
      } else {
        pushToast({ title: 'Some settings failed to save', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Failed to save settings', variant: 'error' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveCurrency = async (next: string) => {
    setCurrency(next);
    setSavingKey('baseCurrency');
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'baseCurrency', value: next }),
      });
      if (!res.ok) {
        pushToast({ title: 'Failed to save currency', variant: 'error' });
        return;
      }
      // The currency is read once at the root layout (server component), so
      // refresh the router to re-fetch it everywhere rather than requiring a
      // full page reload.
      router.refresh();
      pushToast({ title: 'Currency updated', variant: 'success' });
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Failed to save currency', variant: 'error' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveKycRegion = async (next: KycRegion) => {
    setKycRegion(next);
    setSavingKey('kycRegion');
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'kycRegion', value: next }),
      });
      if (!res.ok) {
        pushToast({ title: 'Failed to save KYC region', variant: 'error' });
      } else {
        pushToast({ title: 'KYC region updated', variant: 'success' });
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Failed to save KYC region', variant: 'error' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const renderField = (field: SettingField) => (
    <div key={field.key} className="grid gap-2">
      <Label>{field.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          step={field.step || '1'}
          value={values[field.key] ?? ''}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
        />
        {field.suffix && <span className="text-sm text-muted-foreground shrink-0">{field.suffix}</span>}
      </div>
    </div>
  );

  const renderSectionSaveButton = (sectionKey: string, fields: SettingField[]) => (
    <Button onClick={() => handleSaveSection(sectionKey, fields)} disabled={savingKey === sectionKey} className="w-fit">
      <Save className="w-4 h-4 mr-2" /> {savingKey === sectionKey ? 'Saving...' : 'Save Changes'}
    </Button>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground mt-1">Manage global configuration for the store.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            The currency used for all prices and totals site-wide. This relabels/reformats existing amounts —
            it does not convert between currencies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid gap-2 flex-1 max-w-xs">
              <Label>Base Currency</Label>
              <Select value={currency} onValueChange={(v) => v && handleSaveCurrency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              Preview: {formatPrice(3500, currency)}
              {savingKey === 'baseCurrency' && <Loader2 className="inline w-3.5 h-3.5 ml-2 animate-spin" />}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery & Checkout</CardTitle>
          <CardDescription>Configure global parameters for orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {CHECKOUT_FIELDS.map(renderField)}
          {renderSectionSaveButton('checkout', CHECKOUT_FIELDS)}
        </CardContent>
      </Card>

      {showServices && (
        <Card>
          <CardHeader>
            <CardTitle>Gardener Services</CardTitle>
            <CardDescription>Default commission, discount, and SLA parameters for the services module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 max-w-xs">
              <Label>Gardener KYC Region</Label>
              <Select value={kycRegion} onValueChange={(v) => v && handleSaveKycRegion(v as KycRegion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KYC_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{KYC_REGION_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which identity documents the Gardener application form asks for.
                {savingKey === 'kycRegion' && <Loader2 className="inline w-3.5 h-3.5 ml-2 animate-spin" />}
              </p>
            </div>
            {GARDENER_FIELDS.map(renderField)}
            {renderSectionSaveButton('gardener', GARDENER_FIELDS)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
