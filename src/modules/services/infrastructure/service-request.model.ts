import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export type RequestStatus = 'REQUESTED' | 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface IRequestStatusHistory {
  _id?: string;
  status: RequestStatus;
  actorId?: string;
  note?: string;
  createdAt: Date;
}

export interface IServiceRequest extends Document<string> {
  _id: string;
  requestNumber: string;
  customerId: string;
  categoryId: string;
  description: string;
  preferredDate?: Date;
  address: Record<string, unknown>; // Mixed for now
  assignmentMode: 'specific' | 'open';
  selectedGardenerId?: string;
  assignedGardenerId?: string;
  assignedAt?: Date;
  status: RequestStatus;
  statusHistory: IRequestStatusHistory[];
  quotedPrice?: number;
  completedAmount?: number;
  platformCommissionPercent?: number;
  platformCommissionAmount?: number;
  commissionSettlementStatus?: 'PENDING' | 'SETTLED' | 'WAIVED';
  createdAt: Date;
  updatedAt: Date;
}

const requestStatusHistorySchema = new Schema<IRequestStatusHistory>({
  _id: { type: String, default: generateId },
  status: { type: String, required: true },
  actorId: { type: String, ref: 'User' },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    _id: { type: String, default: generateId },
    requestNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, ref: 'User', required: true, index: true },
    categoryId: { type: String, ref: 'Category', required: true },
    description: { type: String, required: true },
    preferredDate: { type: Date },
    address: { type: Schema.Types.Mixed, required: true },
    assignmentMode: { type: String, enum: ['specific', 'open'], required: true },
    selectedGardenerId: { type: String, ref: 'User' },
    assignedGardenerId: { type: String, ref: 'User', index: true },
    assignedAt: { type: Date },
    status: { type: String, required: true, index: true },
    statusHistory: [requestStatusHistorySchema],
    quotedPrice: { type: Number },
    completedAmount: { type: Number },
    platformCommissionPercent: { type: Number },
    platformCommissionAmount: { type: Number },
    commissionSettlementStatus: { type: String, enum: ['PENDING', 'SETTLED', 'WAIVED'] },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ status: 1, assignedAt: 1 }); // For SLA sweep

export const ServiceRequestModel = mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', serviceRequestSchema);
