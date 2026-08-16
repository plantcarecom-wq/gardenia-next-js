import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';
import { KYC_REGIONS, KycRegion } from '@/shared/lib/kyc';

export interface IGardenerProfile extends Document<string> {
  _id: string;
  userId: string;
  bio?: string;
  serviceAreaCities: string[];
  experienceYears: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  // KYC — the region active at submission time is snapshotted here so a
  // later admin change to the site-wide KYC region never retroactively
  // invalidates or relabels an already-submitted application (same
  // snapshot pattern used for order currency).
  kycRegion: KycRegion;
  cvMediaId?: string;
  // Pre-KYC-redesign field: applications submitted before the per-region
  // document fields (cvMediaId/cnicFrontMediaId/...) existed stored their
  // uploads here. Kept read-only so those older applications still show
  // their documents in the admin review modal.
  documentMediaIds?: string[];
  licenseNumber?: string;
  // Pakistan KYC
  cnicNumber?: string;
  cnicFrontMediaId?: string;
  cnicBackMediaId?: string;
  // Europe KYC
  nationalIdNumber?: string;
  idDocumentMediaId?: string;
  taxId?: string;
  ratingAverage: number;
  ratingCount: number;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gardenerProfileSchema = new Schema<IGardenerProfile>(
  {
    _id: { type: String, default: generateId },
    userId: { type: String, ref: 'User', required: true, unique: true, index: true },
    bio: { type: String },
    serviceAreaCities: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    kycRegion: { type: String, enum: KYC_REGIONS, required: true },
    cvMediaId: { type: String, ref: 'Media' },
    documentMediaIds: [{ type: String, ref: 'Media' }],
    licenseNumber: { type: String, trim: true },
    cnicNumber: { type: String, trim: true },
    cnicFrontMediaId: { type: String, ref: 'Media' },
    cnicBackMediaId: { type: String, ref: 'Media' },
    nationalIdNumber: { type: String, trim: true },
    idDocumentMediaId: { type: String, ref: 'Media' },
    taxId: { type: String, trim: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    approvedBy: { type: String, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export const GardenerProfileModel = mongoose.models.GardenerProfile || mongoose.model<IGardenerProfile>('GardenerProfile', gardenerProfileSchema);
