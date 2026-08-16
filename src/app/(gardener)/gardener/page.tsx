'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, Clock, XCircle, ArrowRight, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUploader } from '@/components/media/image-uploader';
import { DEFAULT_KYC_REGION, KycRegion } from '@/shared/lib/kyc';

type MediaRef = { _id: string; url: string; mimeType: string } | null | undefined;

type Profile = {
  _id: string;
  bio?: string;
  serviceAreaCities: string[];
  experienceYears: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  kycRegion?: KycRegion;
  cvMediaId?: MediaRef;
  licenseNumber?: string;
  cnicNumber?: string;
  cnicFrontMediaId?: MediaRef;
  cnicBackMediaId?: MediaRef;
  nationalIdNumber?: string;
  idDocumentMediaId?: MediaRef;
  taxId?: string;
};

function DocLink({ label, media }: { label: string; media: MediaRef }) {
  if (!media?.url) return <p className="text-muted-foreground">{label}: Not uploaded</p>;
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline"
    >
      <FileText className="h-3.5 w-3.5" /> {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

const emptyForm = {
  bio: '',
  serviceAreaCities: '',
  experienceYears: 0,
  cvMediaId: '' as string,
  licenseNumber: '',
  cnicNumber: '',
  cnicFrontMediaId: '' as string,
  cnicBackMediaId: '' as string,
  nationalIdNumber: '',
  idDocumentMediaId: '' as string,
  taxId: '',
};

export default function GardenerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kycRegion, setKycRegion] = useState<KycRegion>(DEFAULT_KYC_REGION);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.all([
        fetch('/api/v1/gardener/profile'),
        fetch('/api/v1/settings'),
      ]);
      const profileData = await profileRes.json();
      const settingsData = await settingsRes.json();

      if (settingsData.success) {
        const kycSetting = settingsData.data.find((s: { key: string }) => s.key === 'kycRegion');
        if (kycSetting) setKycRegion(kycSetting.value);
      }

      if (profileData.success && profileData.data) {
        const p: Profile = profileData.data;
        setProfile(p);
        setForm({
          bio: p.bio || '',
          serviceAreaCities: (p.serviceAreaCities || []).join(', '),
          experienceYears: p.experienceYears || 0,
          cvMediaId: p.cvMediaId?._id || '',
          licenseNumber: p.licenseNumber || '',
          cnicNumber: p.cnicNumber || '',
          cnicFrontMediaId: p.cnicFrontMediaId?._id || '',
          cnicBackMediaId: p.cnicBackMediaId?._id || '',
          nationalIdNumber: p.nationalIdNumber || '',
          idDocumentMediaId: p.idDocumentMediaId?._id || '',
          taxId: p.taxId || '',
        });
      } else {
        setEditing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const serviceAreaCities = form.serviceAreaCities.split(',').map((c) => c.trim()).filter(Boolean);
    if (serviceAreaCities.length === 0) {
      setError('Please list at least one service area city.');
      return;
    }
    if (!form.cvMediaId) {
      setError('Please upload your CV.');
      return;
    }

    const payload: Record<string, unknown> = {
      bio: form.bio,
      serviceAreaCities,
      experienceYears: Number(form.experienceYears) || 0,
      cvMediaId: form.cvMediaId,
      licenseNumber: form.licenseNumber || undefined,
    };

    if (kycRegion === 'europe') {
      if (!form.nationalIdNumber || !form.idDocumentMediaId) {
        setError('Please provide your national ID / passport number and upload the document.');
        return;
      }
      payload.nationalIdNumber = form.nationalIdNumber;
      payload.idDocumentMediaId = form.idDocumentMediaId;
      payload.taxId = form.taxId || undefined;
    } else {
      if (!form.cnicNumber || !form.cnicFrontMediaId || !form.cnicBackMediaId) {
        setError('Please provide your CNIC number and upload both sides of your CNIC.');
        return;
      }
      payload.cnicNumber = form.cnicNumber;
      payload.cnicFrontMediaId = form.cnicFrontMediaId;
      payload.cnicBackMediaId = form.cnicBackMediaId;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/gardener/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(false);
        fetchAll();
      } else {
        setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusBanner = () => {
    if (!profile) return null;
    if (profile.verificationStatus === 'pending') {
      return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 mb-6">
          <Clock className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Under review</p>
            <p className="text-sm">An admin needs to approve your application before you can list services.</p>
          </div>
        </div>
      );
    }
    if (profile.verificationStatus === 'approved') {
      return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 mb-6">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Verified Gardener</p>
            <p className="text-sm">You're approved and ready to list services.</p>
          </div>
          <Link href="/gardener/offerings">
            <Button size="sm" className="shrink-0">
              Manage services <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      );
    }
    if (profile.verificationStatus === 'rejected') {
      return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 mb-6">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Application rejected</p>
            <p className="text-sm">You can update and resubmit your profile below.</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Gardener Profile</h1>
      <p className="text-muted-foreground mb-6">Your public seller profile and verification status.</p>

      {statusBanner()}

      {!editing && profile ? (
        <Card>
          <CardHeader>
            <CardTitle>{profile.experienceYears} years of experience</CardTitle>
            <CardDescription>{profile.serviceAreaCities.join(', ')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>KYC region: {profile.kycRegion === 'europe' ? 'Europe' : 'Pakistan'}</p>
              {profile.licenseNumber && <p>License number: {profile.licenseNumber}</p>}
              {profile.kycRegion === 'europe' ? (
                <p>National ID / Passport: {profile.nationalIdNumber || 'Not provided'}</p>
              ) : (
                <p>CNIC: {profile.cnicNumber || 'Not provided'}</p>
              )}
            </div>
            <div className="text-sm space-y-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Documents</p>
              <DocLink label="CV / Resume" media={profile.cvMediaId} />
              {profile.kycRegion === 'europe' ? (
                <DocLink label="National ID / Passport" media={profile.idDocumentMediaId} />
              ) : (
                <>
                  <DocLink label="CNIC — front" media={profile.cnicFrontMediaId} />
                  <DocLink label="CNIC — back" media={profile.cnicBackMediaId} />
                </>
              )}
            </div>
            <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{profile ? 'Edit your profile' : 'Complete your Gardener profile'}</CardTitle>
            <CardDescription>
              Tell customers about your experience and where you work. KYC requirements below are set for{' '}
              {kycRegion === 'europe' ? 'Europe' : 'Pakistan'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell customers about your gardening experience..."
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cities">Service area cities</Label>
                <Input
                  id="cities"
                  value={form.serviceAreaCities}
                  onChange={(e) => setForm({ ...form, serviceAreaCities: e.target.value })}
                  placeholder="Lahore, Karachi, Islamabad"
                  required
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of cities you serve.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Business / professional license number (optional)</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="e.g. registered business or trade license number"
                />
              </div>
              <div className="space-y-2">
                <Label>CV / Resume</Label>
                <ImageUploader
                  value={form.cvMediaId ? [form.cvMediaId] : []}
                  onChange={(ids) => setForm({ ...form, cvMediaId: ids[0] || '' })}
                  maxFiles={1}
                  folder="gardener-documents"
                  accept="application/pdf,image/*"
                  hint="PDF or image, max 5MB"
                />
              </div>

              {kycRegion === 'europe' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nationalIdNumber">National ID / Passport number</Label>
                    <Input
                      id="nationalIdNumber"
                      value={form.nationalIdNumber}
                      onChange={(e) => setForm({ ...form, nationalIdNumber: e.target.value })}
                      placeholder="National ID or passport number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>National ID / Passport document</Label>
                    <ImageUploader
                      value={form.idDocumentMediaId ? [form.idDocumentMediaId] : []}
                      onChange={(ids) => setForm({ ...form, idDocumentMediaId: ids[0] || '' })}
                      maxFiles={1}
                      folder="gardener-documents"
                      accept="application/pdf,image/*"
                      hint="PDF or image, max 5MB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">VAT / Tax ID (optional)</Label>
                    <Input
                      id="taxId"
                      value={form.taxId}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                      placeholder="VAT or tax identification number"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cnicNumber">CNIC number</Label>
                    <Input
                      id="cnicNumber"
                      value={form.cnicNumber}
                      onChange={(e) => setForm({ ...form, cnicNumber: e.target.value })}
                      placeholder="12345-1234567-1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNIC — front</Label>
                    <ImageUploader
                      value={form.cnicFrontMediaId ? [form.cnicFrontMediaId] : []}
                      onChange={(ids) => setForm({ ...form, cnicFrontMediaId: ids[0] || '' })}
                      maxFiles={1}
                      folder="gardener-documents"
                      accept="image/*"
                      hint="Image, max 5MB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNIC — back</Label>
                    <ImageUploader
                      value={form.cnicBackMediaId ? [form.cnicBackMediaId] : []}
                      onChange={(ids) => setForm({ ...form, cnicBackMediaId: ids[0] || '' })}
                      maxFiles={1}
                      folder="gardener-documents"
                      accept="image/*"
                      hint="Image, max 5MB"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : profile ? 'Save & resubmit' : 'Submit for review'}
                </Button>
                {profile && (
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
