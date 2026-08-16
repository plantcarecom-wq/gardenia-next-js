import mongoose, { Schema, Document } from 'mongoose';
import { generateId } from '@/shared/lib/generate-id';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface IOrderItem {
  _id?: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  subTotal: number;
}

export interface IOrderStatusHistory {
  _id?: string;
  status: OrderStatus;
  timestamp: Date;
  actorId?: string;
  note?: string;
}

export interface IOrder extends Document<string> {
  _id: string;
  orderNumber: string;
  customerId: string;
  items: IOrderItem[];
  shippingAddress: Record<string, unknown>; // Simplified for now
  totalAmount: number;
  currency: string;
  discountCode?: string;
  discountAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  stockRestored: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  _id: { type: String, default: generateId },
  productId: { type: String, ref: 'Product', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  subTotal: { type: Number, required: true, min: 0 },
});

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  _id: { type: String, default: generateId },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actorId: { type: String, ref: 'User' },
  note: { type: String },
});

const orderSchema = new Schema<IOrder>(
  {
    _id: { type: String, default: generateId },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'PKR' },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, required: true },
    status: { type: String, required: true, index: true, default: 'pending' },
    statusHistory: [orderStatusHistorySchema],
    // Tracks whether stock has ever been restored for this order, independent
    // of current status — guards against double-restoring stock if an admin
    // flips status back and forth (e.g. cancelled -> confirmed -> cancelled).
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for finding customer's orders by status
orderSchema.index({ customerId: 1, status: 1 });

export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
